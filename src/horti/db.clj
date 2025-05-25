(ns horti.db
  (:require [monger.collection :as mc]
            [monger.core :as mg]
            [monger.util :as mu]))

(defn connect-to-mongo
  "Connects to MongoDB using the provided URI"
  [uri]
  (mg/connect-via-uri uri))

(defn disconnect-from-mongo
  "Disconnects from MongoDB"
  [conn]
  (when conn (mg/disconnect conn)))

(defn create-indexes
  "Creates necessary indexes for the horti collections"
  [db]
  ;; Index for user profiles by email
  (mc/ensure-index db "users" (array-map :email 1) {:unique true})
  ;; Index for plant data by user and date
  (mc/ensure-index db "plants" (array-map :user-email 1 :created-at 1) {:name "plants_user_date_idx"})
  ;; Index for garden logs by user and date
  (mc/ensure-index db "garden-logs" (array-map :user-email 1 :date 1) {:name "logs_user_date_idx"})
  ;; Index for daily metrics by plant and date
  (mc/ensure-index db "daily-metrics" (array-map :plant-id 1 :date 1) {:name "metrics_plant_date_idx"}))

(defn save-document
  "Saves a document to the specified collection"
  [db collection document]
  (try
    {:result (mc/insert-and-return db collection document)}
    (catch Exception e
      {:error (.getMessage e)})))

(defn find-documents
  "Finds documents in a collection by query"
  [db collection query]
  (mc/find-maps db collection query))

(defn find-document-by-id
  "Finds a single document by its ObjectId"
  [db collection id]
  (mc/find-map-by-id db collection (mu/object-id id)))

(defn update-document
  "Updates a document by its ObjectId"
  [db collection id update-data]
  (mc/update-by-id db collection (mu/object-id id) {"$set" update-data}))

(defn delete-document
  "Deletes a document by its ObjectId"
  [db collection id]
  (mc/remove-by-id db collection (mu/object-id id)))

(defn save-user-profile
  "Saves or updates a user profile"
  [db email profile-data]
  (try
    (let [existing (mc/find-one-as-map db "users" {:email email})]
      (if existing
        {:result (mc/update db "users" {:email email} {"$set" profile-data})}
        {:result (mc/insert-and-return db "users" (assoc profile-data :email email))}))
    (catch Exception e
      {:error (.getMessage e)})))

(defn get-user-plants
  "Gets all plants for a specific user"
  [db user-email]
  (find-documents db "plants" {:user-email user-email}))

(defn save-plant
  "Saves a new plant entry with canvas position"
  [db user-email plant-data]
  (save-document db "plants" 
                 (assoc plant-data 
                        :user-email user-email
                        :created-at (java.util.Date.))))

(defn save-daily-metrics
  "Saves daily metrics for a specific plant"
  [db user-email plant-id metrics-data]
  (save-document db "daily-metrics"
                 (assoc metrics-data
                        :user-email user-email
                        :plant-id plant-id
                        :recorded-at (java.util.Date.))))

(defn get-plant-metrics
  "Gets daily metrics for a plant within a date range, filtered by user for security"
  [db plant-id start-date end-date user-email]
  (let [base-query {:plant-id plant-id :user-email user-email}
        query (if (and start-date end-date)
                (assoc base-query :date {"$gte" start-date "$lte" end-date})
                base-query)]
    (find-documents db "daily-metrics" query)))

(defn get-garden-logs
  "Gets garden logs for a user within a date range"
  [db user-email start-date end-date]
  (find-documents db "garden-logs" 
                  {:user-email user-email
                   :date {"$gte" start-date "$lte" end-date}}))

(defn save-garden-log
  "Saves a new garden log entry"
  [db user-email log-data]
  (save-document db "garden-logs"
                 (assoc log-data 
                        :user-email user-email
                        :created-at (java.util.Date.)))) 