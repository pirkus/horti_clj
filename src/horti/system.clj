(ns horti.system
  (:require
   [clojure.tools.logging :as log]
   [com.stuartsierra.component :as component]
   [io.pedestal.http :as http]
   [io.pedestal.http.body-params :refer [body-params]]
   [io.pedestal.http.route :as route]
   [io.pedestal.interceptor.error :as err]
   [monger.collection :as mc]
   [horti.db :as db]
   [horti.http-resp :as http-resp]
   [horti.jwt :as jwt]
   [ring.util.response :as response]))

(def exception-handler
  (err/error-dispatch [context ex]
    [{:exception-type :com.fasterxml.jackson.core.io.JsonEOFException}]
    (do
      (log/warn "JSON parsing error:" ex)
      (assoc context :response (http-resp/handle-validation-error ex)))

    [{:exception-type :com.mongodb.MongoException}]
    (do
      (log/error "MongoDB error:" ex)
      (assoc context :response (http-resp/handle-db-error ex)))

    :else
    (do
      (log/error "Unhandled exception:" ex)
      (assoc context :response (http-resp/server-error (str ex))))))

;; ----------------------------------------------------------------------------
;; Mongo Component
;; ----------------------------------------------------------------------------

(defrecord MongoComponent [uri conn db]
  component/Lifecycle
  (start [this]
    (let [{:keys [conn db]} (db/connect-to-mongo uri)]
      (db/create-indexes db)
      (assoc this :conn conn :db db)))
  (stop [this]
    (db/disconnect-from-mongo conn)
    (assoc this :conn nil :db nil)))

;; ----------------------------------------------------------------------------
;; Route Handlers
;; ----------------------------------------------------------------------------

(defn create-plant-handler [db]
  (fn [request]
    (try
      (let [{:keys [name species planting-date notes x y image-url]} (:json-params request)
            user-email (get-in request [:identity :email])
            plant-data {:name name 
                       :species species 
                       :planting-date planting-date 
                       :notes notes
                       :x x
                       :y y
                       :image-url image-url}
            result (db/save-plant db user-email plant-data)]
        (if (contains? result :result)
          (http-resp/created {:result "Plant saved" :id (str (:_id (:result result)))})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-plants-handler [db]
  (fn [request]
    (try
      (let [user-email (get-in request [:identity :email])
            plants (db/get-user-plants db user-email)]
        (http-resp/ok (->> plants 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn create-garden-log-handler [db]
  (fn [request]
    (try
      (let [{:keys [date activity notes plants weather]} (:json-params request)
            user-email (get-in request [:identity :email])
            log-data {:date date 
                     :activity activity 
                     :notes notes 
                     :plants plants 
                     :weather weather}
            result (db/save-garden-log db user-email log-data)]
        (if (contains? result :result)
          (http-resp/created {:result "Garden log saved" :id (str (:_id (:result result)))})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-garden-logs-handler [db]
  (fn [request]
    (try
      (let [user-email (get-in request [:identity :email])
            start-date (get-in request [:query-params :startDate])
            end-date (get-in request [:query-params :endDate])
            logs (if (and start-date end-date)
                   (db/get-garden-logs db user-email start-date end-date)
                   (db/find-documents db "garden-logs" {:user-email user-email}))]
        (http-resp/ok (->> logs 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn create-daily-metrics-handler [db]
  (fn [request]
    (try
      (let [{:keys [plant-id date ec ph notes]} (:json-params request)
            user-email (get-in request [:identity :email])
            metrics-data {:date date
                         :ec ec
                         :ph ph
                         :notes notes}
            result (db/save-daily-metrics db user-email plant-id metrics-data)]
        (if (contains? result :result)
          (http-resp/created {:result "Metrics saved" :id (str (:_id (:result result)))})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-plant-metrics-handler [db]
  (fn [request]
    (try
      (let [plant-id (get-in request [:path-params :plant-id])
            user-email (get-in request [:identity :email])
            start-date (get-in request [:query-params :startDate])
            end-date (get-in request [:query-params :endDate])
            metrics (db/get-plant-metrics db plant-id start-date end-date user-email)]
        (http-resp/ok (->> metrics 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn update-plant-handler [db]
  (fn [request]
    (try
      (let [plant-id (get-in request [:path-params :plant-id])
            user-email (get-in request [:identity :email])
            update-data (:json-params request)]
        ;; Verify the plant belongs to the user before updating
        (if-let [existing-plant (db/find-document-by-id db "plants" plant-id)]
          (if (= (:user-email existing-plant) user-email)
            (let [result (db/update-document db "plants" plant-id update-data)]
              (if result
                (http-resp/ok {:result "Plant updated successfully"})
                (http-resp/server-error "Failed to update plant")))
            (http-resp/forbidden "Access denied"))
          (http-resp/not-found "Plant not found")))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn health-check-handler [_]
  (fn [_]
    (http-resp/ok {:status "healthy" :timestamp (java.time.Instant/now)})))

;; ----------------------------------------------------------------------------
;; Routes
;; ----------------------------------------------------------------------------

(defn create-routes [db]
  (route/expand-routes
   #{["/api/health" :get (health-check-handler db) :route-name :health-check]
     ["/api/plants" :post [(body-params) jwt/auth-interceptor (create-plant-handler db)] :route-name :create-plant]
     ["/api/plants" :get [jwt/auth-interceptor (get-plants-handler db)] :route-name :get-plants]
     ["/api/plants/:plant-id/metrics" :post [(body-params) jwt/auth-interceptor (create-daily-metrics-handler db)] :route-name :create-metrics]
     ["/api/plants/:plant-id/metrics" :get [jwt/auth-interceptor (get-plant-metrics-handler db)] :route-name :get-plant-metrics]
     ["/api/garden-logs" :post [(body-params) jwt/auth-interceptor (create-garden-log-handler db)] :route-name :create-garden-log]
     ["/api/garden-logs" :get [jwt/auth-interceptor (get-garden-logs-handler db)] :route-name :get-garden-logs]
     ["/api/plants/:plant-id" :put [(body-params) jwt/auth-interceptor (update-plant-handler db)] :route-name :update-plant]}))

;; ----------------------------------------------------------------------------
;; HTTP Component
;; ----------------------------------------------------------------------------

(defrecord HttpComponent [port mongo service]
  component/Lifecycle
  (start [this]
    (let [db (:db mongo)
          routes (create-routes db)
          service-map {::http/routes routes
                      ::http/type :jetty
                      ::http/port port
                      ::http/resource-path "/public"
                      ::http/allowed-origins {:creds true :allowed-origins (constantly true)}
                      ::http/secure-headers {:content-type-options :nosniff}}
          service (-> service-map
                     (http/default-interceptors)
                     (update ::http/interceptors conj exception-handler)
                     (http/create-server)
                     (http/start))]
      (log/info "Horti server started on port" port)
      (assoc this :service service)))
  (stop [this]
    (when service
      (http/stop service)
      (log/info "Horti server stopped"))
    (assoc this :service nil)))

;; ----------------------------------------------------------------------------
;; System
;; ----------------------------------------------------------------------------

(defn create-system [config]
  (component/system-map
   :mongo (map->MongoComponent {:uri (:mongo-uri config)})
   :http (component/using
          (map->HttpComponent {:port (:port config)})
          [:mongo])))