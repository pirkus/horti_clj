(ns horti.core
  (:require [com.stuartsierra.component :as component]
            [horti.system :as system]
            [clojure.tools.logging :as log])
  (:gen-class))

(def default-config
  {:port 8080
   :mongo-uri "mongodb://localhost:27017/horti"})

(defonce system-atom (atom nil))

(defn start-system! 
  "Starts the application system"
  [config]
  (let [sys (component/start (system/create-system config))]
    (reset! system-atom sys)
    (log/info "Horti application started")
    sys))

(defn stop-system!
  "Stops the application system"
  []
  (when-let [sys @system-atom]
    (component/stop sys)
    (reset! system-atom nil)
    (log/info "Horti application stopped")))

(defn restart-system!
  "Restarts the application system"
  [config]
  (stop-system!)
  (start-system! config))

(defn -main
  "Main entry point for the application"
  [& args]
  (let [config (merge default-config 
                      (when-let [port (first args)]
                        {:port (Integer/parseInt port)}))]
    (log/info "Starting Horti application with config:" config)
    (start-system! config)
    ;; Keep the main thread alive
    (.addShutdownHook (Runtime/getRuntime)
                      (Thread. #(stop-system!)))
    @(promise))) ; Block forever