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

(defn delete-plant-handler [db]
  (fn [request]
    (try
      (let [plant-id (get-in request [:path-params :plant-id])
            user-email (get-in request [:identity :email])]
        ;; Verify the plant belongs to the user before deleting
        (if-let [existing-plant (db/find-document-by-id db "plants" plant-id)]
          (if (= (:user-email existing-plant) user-email)
            (let [result (db/delete-document db "plants" plant-id)]
              (if result
                (http-resp/ok {:result "Plant deleted successfully"})
                (http-resp/server-error "Failed to delete plant")))
            (http-resp/forbidden "Access denied"))
          (http-resp/not-found "Plant not found")))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn create-canvas-handler [db]
  (fn [request]
    (try
      (let [{:keys [name description width height]} (:json-params request)
            user-email (get-in request [:identity :email])
            canvas-data {:name name
                        :description description
                        :width (or width 800)
                        :height (or height 600)}
            result (db/save-canvas db user-email canvas-data)]
        (if (contains? result :result)
          (http-resp/created {:result "Canvas created" :id (str (:_id (:result result)))})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-canvases-handler [db]
  (fn [request]
    (try
      (let [user-email (get-in request [:identity :email])
            canvases (db/get-user-canvases db user-email)]
        (http-resp/ok (->> canvases 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-canvas-handler [db]
  (fn [request]
    (try
      (let [canvas-id (get-in request [:path-params :canvas-id])
            user-email (get-in request [:identity :email])
            canvas (db/find-document-by-id db "canvases" canvas-id)]
        (if canvas
          (if (= (:user-email canvas) user-email)
            (http-resp/ok (-> canvas 
                             (assoc :id (str (:_id canvas))) 
                             (dissoc :_id)))
            (http-resp/forbidden "Access denied"))
          (http-resp/not-found "Canvas not found")))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-canvas-plants-handler [db]
  (fn [request]
    (try
      (let [canvas-id (get-in request [:path-params :canvas-id])
            user-email (get-in request [:identity :email])
            plants (db/get-canvas-plants db canvas-id user-email)]
        (http-resp/ok (->> plants 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn create-canvas-plant-handler [db]
  (fn [request]
    (try
      (let [canvas-id (get-in request [:path-params :canvas-id])
            {:keys [name type x y planting-date]} (:json-params request)
            user-email (get-in request [:identity :email])
            plant-data {:name name 
                       :type type 
                       :x x
                       :y y
                       :planting-date planting-date}
            result (db/save-canvas-plant db user-email canvas-id plant-data)]
        (if (contains? result :result)
          (http-resp/created {:result "Plant saved" :id (str (:_id (:result result)))})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn update-canvas-handler [db]
  (fn [request]
    (try
      (let [canvas-id (get-in request [:path-params :canvas-id])
            user-email (get-in request [:identity :email])
            {:keys [name description width height]} (:json-params request)
            update-data (cond-> {}
                          name (assoc :name name)
                          description (assoc :description description)
                          width (assoc :width width)
                          height (assoc :height height))
            result (db/update-canvas db canvas-id user-email update-data)]
        (if (contains? result :result)
          (do
            ;; If dimensions changed, move plants inside bounds
            (when (and width height)
              (db/move-plants-inside-canvas db canvas-id width height user-email))
            (http-resp/ok {:result "Canvas updated successfully"}))
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn archive-canvas-handler [db]
  (fn [request]
    (try
      (let [canvas-id (get-in request [:path-params :canvas-id])
            user-email (get-in request [:identity :email])
            {:keys [archived]} (:json-params request)
            result (db/archive-canvas db canvas-id user-email archived)]
        (if (contains? result :result)
          (http-resp/ok {:result (if archived "Canvas archived" "Canvas unarchived")})
          (http-resp/bad-request (:error result))))
      (catch Exception e
        (http-resp/handle-db-error e)))))

(defn get-archived-canvases-handler [db]
  (fn [request]
    (try
      (let [user-email (get-in request [:identity :email])
            canvases (db/get-user-archived-canvases db user-email)]
        (http-resp/ok (->> canvases 
                          (map #(-> % 
                                   (assoc :id (str (:_id %))) 
                                   (dissoc :_id))))))
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
     ;; Canvas routes
     ["/api/canvases" :post [(body-params) jwt/auth-interceptor (create-canvas-handler db)] :route-name :create-canvas]
     ["/api/canvases" :get [jwt/auth-interceptor (get-canvases-handler db)] :route-name :get-canvases]
     ["/api/canvases/archived" :get [jwt/auth-interceptor (get-archived-canvases-handler db)] :route-name :get-archived-canvases]
     ["/api/canvases/:canvas-id" :get [jwt/auth-interceptor (get-canvas-handler db)] :route-name :get-canvas]
     ["/api/canvases/:canvas-id" :put [(body-params) jwt/auth-interceptor (update-canvas-handler db)] :route-name :update-canvas]
     ["/api/canvases/:canvas-id/archive" :put [(body-params) jwt/auth-interceptor (archive-canvas-handler db)] :route-name :archive-canvas]
     ["/api/canvases/:canvas-id/plants" :get [jwt/auth-interceptor (get-canvas-plants-handler db)] :route-name :get-canvas-plants]
     ["/api/canvases/:canvas-id/plants" :post [(body-params) jwt/auth-interceptor (create-canvas-plant-handler db)] :route-name :create-canvas-plant]
     ;; Legacy plant routes (for backward compatibility)
     ["/api/plants" :post [(body-params) jwt/auth-interceptor (create-plant-handler db)] :route-name :create-plant]
     ["/api/plants" :get [jwt/auth-interceptor (get-plants-handler db)] :route-name :get-plants]
     ["/api/plants/:plant-id/metrics" :post [(body-params) jwt/auth-interceptor (create-daily-metrics-handler db)] :route-name :create-metrics]
     ["/api/plants/:plant-id/metrics" :get [jwt/auth-interceptor (get-plant-metrics-handler db)] :route-name :get-plant-metrics]
     ["/api/plants/:plant-id" :put [(body-params) jwt/auth-interceptor (update-plant-handler db)] :route-name :update-plant]
     ["/api/plants/:plant-id" :delete [jwt/auth-interceptor (delete-plant-handler db)] :route-name :delete-plant]}))

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