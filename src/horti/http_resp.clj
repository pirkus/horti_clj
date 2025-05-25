(ns horti.http-resp
  (:require [cheshire.core :as json]
            [ring.util.response :as response]))

(defn json-response
  "Creates a JSON response with given status and data"
  [status data]
  (-> (response/response (json/generate-string data))
      (response/status status)
      (response/content-type "application/json")))

(defn ok
  "Creates a 200 OK JSON response"
  [data]
  (json-response 200 data))

(defn created
  "Creates a 201 Created JSON response"
  [data]
  (json-response 201 data))

(defn bad-request
  "Creates a 400 Bad Request JSON response"
  [data]
  (json-response 400 data))

(defn unauthorized
  "Creates a 401 Unauthorized JSON response"
  [data]
  (json-response 401 data))

(defn forbidden
  "Creates a 403 Forbidden JSON response"
  [data]
  (json-response 403 data))

(defn not-found
  "Creates a 404 Not Found JSON response"
  [data]
  (json-response 404 data))

(defn server-error
  "Creates a 500 Internal Server Error JSON response"
  [data]
  (json-response 500 data))

(defn handle-validation-error
  "Handles validation errors and returns appropriate response"
  [error]
  (bad-request {:error "Validation failed"
                :message (str error)}))

(defn handle-db-error
  "Handles database errors and returns appropriate response"
  [error]
  (server-error {:error "Database error"
                 :message (str error)}))

(defn handle-not-found
  "Handles not found errors"
  [resource]
  (not-found {:error "Resource not found"
              :resource resource})) 