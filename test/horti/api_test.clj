(ns horti.api-test
  (:require [clojure.test :refer :all]
            [io.pedestal.test :as test]
            [io.pedestal.http :as http]
            [cheshire.core :as json]
            [horti.system :as system]
            [horti.jwt :as jwt]
            [horti.db :as db]
            [horti.test-utils :as test-utils :refer [*test-db*]]
            [monger.collection :as mc]
            [com.stuartsierra.component :as component]))

(def test-user-email "test@example.com")
(def other-user-email "other@example.com")
(def test-token "test-token-123")
(def other-token "other-token-456")

(def ^:dynamic *test-service-fn* nil)

(defn create-test-service [db]
  (let [routes (system/create-routes db)
        service-map {::http/routes routes
                    ::http/router :linear-search
                    ::http/type :jetty
                    ::http/port 0
                    ::http/resource-path "/public"
                    ::http/allowed-origins {:creds true :allowed-origins (constantly true)}
                    ::http/secure-headers {:content-type-options :nosniff}}
        service (-> service-map
                   (http/default-interceptors)
                   (update ::http/interceptors conj system/exception-handler)
                   (http/create-servlet)
                   ::http/service-fn)]
    service))

(defn with-test-system [f]
  ;; Mock JWT verification to return appropriate claims based on token
  (with-redefs [jwt/verify-google-jwt (fn [token]
                                        (cond
                                          (= token test-token) {:email test-user-email}
                                          (= token other-token) {:email other-user-email}
                                          :else nil))]
    (let [container (test-utils/start-mongo-container)
          {:keys [conn db]} (test-utils/create-test-db-connection container "horti-api-test")
          service-fn (create-test-service db)]
      (try
        ;; Create indexes once
        (db/create-indexes db)
        
        ;; Run all tests with service
        (binding [*test-service-fn* service-fn
                  test-utils/*test-db* db
                  test-utils/*mongo-container* container]
          (f))
        
        (finally
          ;; Clean up after all tests
          (db/disconnect-from-mongo conn)
          (.stop container))))))

(defn clean-test-system [f]
  ;; Clean database before each test
  (test-utils/clean-test-collections test-utils/*test-db*)
  (f))

(use-fixtures :once with-test-system)
(use-fixtures :each clean-test-system)

(defn auth-header [token]
  {"Authorization" (str "Bearer " token)})

(defn json-headers [token]
  (merge (auth-header token)
         {"Content-Type" "application/json"}))

;; Health Check Tests
(deftest test-health-check
  (testing "Health check endpoint"
    (let [response (test/response-for *test-service-fn* :get "/api/health")]
      (is (= 200 (:status response)))
      (let [body (json/parse-string (:body response) true)]
        (is (= "healthy" (:status body)))
        (is (contains? body :timestamp))))))

;; Canvas API Tests
(deftest test-canvas-api
  (testing "Canvas CRUD operations"
    ;; Create canvas
    (let [canvas-data {:name "API Test Garden"
                      :description "Testing via API"
                      :width 1200
                      :height 900}
          create-response (test/response-for *test-service-fn*
                                           :post "/api/canvases"
                                           :headers (merge (auth-header test-token)
                                                         {"Content-Type" "application/json"})
                                           :body (json/generate-string canvas-data))]
      (is (= 201 (:status create-response)))
      (let [body (json/parse-string (:body create-response) true)
            canvas-id (:id body)]
        
        ;; Get all canvases
        (let [list-response (test/response-for *test-service-fn*
                                             :get "/api/canvases"
                                             :headers (auth-header test-token))]
          (is (= 200 (:status list-response)))
          (let [canvases (json/parse-string (:body list-response) true)]
            (is (= 1 (count canvases)))
            (is (= "API Test Garden" (:name (first canvases))))))
        
        ;; Get specific canvas
        (let [get-response (test/response-for *test-service-fn*
                                            :get (str "/api/canvases/" canvas-id)
                                            :headers (auth-header test-token))]
          (is (= 200 (:status get-response)))
          (let [canvas (json/parse-string (:body get-response) true)]
            (is (= "API Test Garden" (:name canvas)))))
        
        ;; Update canvas
        (let [update-data {:name "Updated Garden" :width 1000}
              update-response (test/response-for *test-service-fn*
                                               :put (str "/api/canvases/" canvas-id)
                                               :headers (json-headers test-token)
                                               :body (json/generate-string update-data))]
          (is (= 200 (:status update-response))))
        
        ;; Archive canvas
        (let [archive-response (test/response-for *test-service-fn*
                                                :put (str "/api/canvases/" canvas-id "/archive")
                                                :headers (json-headers test-token)
                                                :body (json/generate-string {:archived true}))]
          (is (= 200 (:status archive-response))))
        
        ;; Get archived canvases
        (let [archived-response (test/response-for *test-service-fn*
                                                 :get "/api/canvases/archived"
                                                 :headers (auth-header test-token))]
          (is (= 200 (:status archived-response)))
          (let [archived (json/parse-string (:body archived-response) true)]

            (is (= 1 (count archived)))))))))

(deftest test-canvas-security
  (testing "Canvas API security"
    ;; Create canvas as test user
    (let [canvas-data {:name "Private Garden"}
          create-response (test/response-for *test-service-fn*
                                           :post "/api/canvases"
                                           :headers (json-headers test-token)
                                           :body (json/generate-string canvas-data))
          canvas-id (:id (json/parse-string (:body create-response) true))]
      
      ;; Try to access without auth
      (let [no-auth-response (test/response-for *test-service-fn*
                                               :get (str "/api/canvases/" canvas-id))]
        (is (= 401 (:status no-auth-response))))
      
      ;; Try to access as different user
      (let [other-user-response (test/response-for *test-service-fn*
                                                  :get (str "/api/canvases/" canvas-id)
                                                  :headers (auth-header other-token))]
        (is (= 403 (:status other-user-response))))
      
      ;; Try to update as different user
      (let [hack-response (test/response-for *test-service-fn*
                                            :put (str "/api/canvases/" canvas-id)
                                            :headers (json-headers other-token)
                                            :body (json/generate-string {:name "Hacked!"}))]
        (is (= 400 (:status hack-response)))))))

;; Plant API Tests
(deftest test-plant-api
  (testing "Plant CRUD operations"
    ;; Create canvas first
    (let [canvas-response (test/response-for *test-service-fn*
                                           :post "/api/canvases"
                                           :headers (json-headers test-token)
                                           :body (json/generate-string {:name "Plant Test Garden"}))
          canvas-id (:id (json/parse-string (:body canvas-response) true))]
      
      ;; Create plant in canvas
      (let [plant-data {:name "API Tomato"
                       :type "Cherry"
                       :emoji "🍅"
                       :x 150
                       :y 250}
            create-response (test/response-for *test-service-fn*
                                             :post (str "/api/canvases/" canvas-id "/plants")
                                             :headers (json-headers test-token)
                                             :body (json/generate-string plant-data))]
        (is (= 201 (:status create-response)))
        (let [plant-id (:id (json/parse-string (:body create-response) true))]
          
          ;; Get canvas plants
          (let [list-response (test/response-for *test-service-fn*
                                               :get (str "/api/canvases/" canvas-id "/plants")
                                               :headers (auth-header test-token))]
            (is (= 200 (:status list-response)))
            (let [plants (json/parse-string (:body list-response) true)]
              (is (= 1 (count plants)))
              (is (= "API Tomato" (:name (first plants))))))
          
          ;; Update plant
          (let [update-response (test/response-for *test-service-fn*
                                                 :put (str "/api/plants/" plant-id)
                                                 :headers (json-headers test-token)
                                                 :body (json/generate-string {:name "Updated Tomato"
                                                                             :emoji "🍅"}))]
            (is (= 200 (:status update-response))))
          
          ;; Delete plant
          (let [delete-response (test/response-for *test-service-fn*
                                                 :delete (str "/api/plants/" plant-id)
                                                 :headers (auth-header test-token))]
            (is (= 200 (:status delete-response)))))))))

(deftest test-plant-security
  (testing "Plant API security"
    ;; Create plant as test user
    (let [plant-response (test/response-for *test-service-fn*
                                          :post "/api/plants"
                                          :headers (json-headers test-token)
                                          :body (json/generate-string {:name "Private Plant"
                                                                      :x 100 :y 100}))
          plant-id (:id (json/parse-string (:body plant-response) true))]
      
      ;; Try to update as different user
      (let [hack-response (test/response-for *test-service-fn*
                                           :put (str "/api/plants/" plant-id)
                                           :headers (json-headers other-token)
                                           :body (json/generate-string {:name "Hacked Plant"}))]
        (is (= 403 (:status hack-response))))
      
      ;; Try to delete as different user
      (let [delete-response (test/response-for *test-service-fn*
                                             :delete (str "/api/plants/" plant-id)
                                             :headers (auth-header other-token))]
        (is (= 403 (:status delete-response)))))))

;; Metrics API Tests
(deftest test-metrics-api
  (testing "Metrics operations"
    ;; Create plant first
    (let [plant-response (test/response-for *test-service-fn*
                                          :post "/api/plants"
                                          :headers (json-headers test-token)
                                          :body (json/generate-string {:name "Metrics Plant"
                                                                      :x 100 :y 100}))
          plant-id (:id (json/parse-string (:body plant-response) true))]
      
      ;; Create metrics
      (let [metrics-data {:plant-id plant-id
                         :date "2024-05-26"
                         :ec 1.8
                         :ph 6.2
                         :notes "Test metrics"}
            create-response (test/response-for *test-service-fn*
                                             :post (str "/api/plants/" plant-id "/metrics")
                                             :headers (json-headers test-token)
                                             :body (json/generate-string metrics-data))]

        (is (= 201 (:status create-response))))
      
      ;; Get metrics
      (let [get-response (test/response-for *test-service-fn*
                                          :get (str "/api/plants/" plant-id "/metrics")
                                          :headers (auth-header test-token))]

        (is (= 200 (:status get-response)))
        (let [metrics (json/parse-string (:body get-response) true)]

          (is (= 1 (count metrics)))
          (is (= 1.8 (:ec (first metrics))))))
      
      ;; Get metrics with date filter
      (let [filtered-response (test/response-for *test-service-fn*
                                               :get (str "/api/plants/" plant-id "/metrics"
                                                        "?startDate=2024-05-25&endDate=2024-05-27")
                                               :headers (auth-header test-token))]
        (is (= 200 (:status filtered-response)))))))

;; Error Handling Tests
(deftest test-error-handling
  (testing "API error handling"
    ;; Invalid JSON
    (let [bad-json-response (test/response-for *test-service-fn*
                                             :post "/api/canvases"
                                             :headers (json-headers test-token)
                                             :body "{ invalid json")]
      (is (= 400 (:status bad-json-response))))
    
    ;; Missing required fields
    (let [incomplete-response (test/response-for *test-service-fn*
                                               :post "/api/canvases"
                                               :headers (json-headers test-token)
                                               :body (json/generate-string {}))]
      (is (= 400 (:status incomplete-response))))
    
    ;; Non-existent resource
    (let [not-found-response (test/response-for *test-service-fn*
                                              :get "/api/canvases/507f1f77bcf86cd799439011"
                                              :headers (auth-header test-token))]
      (is (= 404 (:status not-found-response))))
    
    ;; Invalid ObjectId
    (let [invalid-id-response (test/response-for *test-service-fn*
                                                :get "/api/canvases/invalid-id"
                                                :headers (auth-header test-token))]
      (is (= 500 (:status invalid-id-response))))))