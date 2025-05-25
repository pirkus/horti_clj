(ns horti.http-resp-test
  (:require [clojure.test :refer [deftest is testing]]
            [cheshire.core :as json]
            [horti.http-resp :as http-resp]))

(deftest json-response-test
  (testing "creates proper JSON response with status and data"
    (let [response (http-resp/json-response 200 {:message "success"})]
      (is (= 200 (:status response)))
      (is (= "application/json" (get-in response [:headers "Content-Type"])))
      (is (= "{\"message\":\"success\"}" (:body response)))))
  
  (testing "handles different status codes"
    (let [response (http-resp/json-response 404 {:error "not found"})]
      (is (= 404 (:status response)))
      (is (= "{\"error\":\"not found\"}" (:body response)))))
  
  (testing "handles complex data structures"
    (let [data {:users [{:id 1 :name "John"} {:id 2 :name "Jane"}]}
          response (http-resp/json-response 200 data)]
      (is (= 200 (:status response)))
      (is (= data (json/parse-string (:body response) true))))))

(deftest status-code-helpers-test
  (testing "ok creates 200 response"
    (let [response (http-resp/ok {:success true})]
      (is (= 200 (:status response)))
      (is (= "{\"success\":true}" (:body response)))))
  
  (testing "created creates 201 response"
    (let [response (http-resp/created {:id 123})]
      (is (= 201 (:status response)))
      (is (= "{\"id\":123}" (:body response)))))
  
  (testing "bad-request creates 400 response"
    (let [response (http-resp/bad-request {:error "invalid input"})]
      (is (= 400 (:status response)))
      (is (= "{\"error\":\"invalid input\"}" (:body response)))))
  
  (testing "unauthorized creates 401 response"
    (let [response (http-resp/unauthorized {:error "not authorized"})]
      (is (= 401 (:status response)))
      (is (= "{\"error\":\"not authorized\"}" (:body response)))))
  
  (testing "forbidden creates 403 response"
    (let [response (http-resp/forbidden {:error "access denied"})]
      (is (= 403 (:status response)))
      (is (= "{\"error\":\"access denied\"}" (:body response)))))
  
  (testing "not-found creates 404 response"
    (let [response (http-resp/not-found {:error "resource missing"})]
      (is (= 404 (:status response)))
      (is (= "{\"error\":\"resource missing\"}" (:body response)))))
  
  (testing "server-error creates 500 response"
    (let [response (http-resp/server-error {:error "internal error"})]
      (is (= 500 (:status response)))
      (is (= "{\"error\":\"internal error\"}" (:body response))))))

(deftest error-handlers-test
  (testing "handle-validation-error creates proper response"
    (let [error (ex-info "Validation failed" {:field "email"})
          response (http-resp/handle-validation-error error)]
      (is (= 400 (:status response)))
      (let [body (json/parse-string (:body response) true)]
        (is (= "Validation failed" (:error body)))
        (is (string? (:message body))))))
  
  (testing "handle-db-error creates proper response"
    (let [error (ex-info "Connection failed" {})
          response (http-resp/handle-db-error error)]
      (is (= 500 (:status response)))
      (let [body (json/parse-string (:body response) true)]
        (is (= "Database error" (:error body)))
        (is (string? (:message body))))))
  
  (testing "handle-not-found creates proper response"
    (let [response (http-resp/handle-not-found "user")]
      (is (= 404 (:status response)))
      (let [body (json/parse-string (:body response) true)]
        (is (= "Resource not found" (:error body)))
        (is (= "user" (:resource body)))))))