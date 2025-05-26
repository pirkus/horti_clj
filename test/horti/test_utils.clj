(ns horti.test-utils
  (:require [horti.db :as db]
            [monger.collection :as mc])
  (:import [org.testcontainers.containers MongoDBContainer]
           [org.testcontainers.utility DockerImageName]))

(def ^:dynamic *test-db* nil)
(def ^:dynamic *mongo-container* nil)

(defn start-mongo-container []
  (let [container (MongoDBContainer. (DockerImageName/parse "mongo:7.0"))]
    (.start container)
    container))

(defn create-test-db-connection [container db-name]
  (let [connection-string (str (.getConnectionString container) "/" db-name)]
    (db/connect-to-mongo connection-string)))

(defn clean-test-collections [db]
  "Cleans all test collections from the database"
  (mc/remove db "users")
  (mc/remove db "plants")
  (mc/remove db "canvases")
  (mc/remove db "daily-metrics"))

(defn setup-test-db-fixture [db-name]
  "Returns a fixture function that sets up a MongoDB container and connection"
  (fn [f]
    (let [container (start-mongo-container)
          {:keys [conn db]} (create-test-db-connection container db-name)]
      (try
        ;; Create indexes once
        (db/create-indexes db)
        
        ;; Run all tests with db
        (binding [*test-db* db
                  *mongo-container* container]
          (f))
        
        (finally
          ;; Clean up after all tests
          (db/disconnect-from-mongo conn)
          (.stop container))))))

(defn clean-db-fixture [f]
  "Fixture that cleans the database before each test"
  (clean-test-collections *test-db*)
  (f))