(ns horti.jwt-test
  (:require [clojure.test :refer [deftest is testing]]
            [horti.jwt :as jwt]))

(deftest extract-bearer-token-test
  (testing "extracts token from valid Bearer authorization header"
    (is (= "valid-token-123" 
           (jwt/extract-bearer-token "Bearer valid-token-123"))))
  
  (testing "returns nil for invalid authorization header"
    (is (nil? (jwt/extract-bearer-token "Basic invalid-header")))
    (is (nil? (jwt/extract-bearer-token "bearer lowercase")))
    (is (nil? (jwt/extract-bearer-token nil)))
    (is (nil? (jwt/extract-bearer-token ""))))
  
  (testing "handles edge cases"
    (is (= "" (jwt/extract-bearer-token "Bearer ")))
    (is (= "token" (jwt/extract-bearer-token "Bearer token")))))

(deftest create-auth-context-test
  (testing "adds identity to context request"
    (let [context {:request {:headers {}}}
          claims {:email "test@example.com" :name "Test User"}
          result (jwt/create-auth-context context claims)]
      (is (= claims (get-in result [:request :identity])))))
  
  (testing "preserves existing context data"
    (let [context {:request {:headers {"content-type" "application/json"}
                            :params {:foo "bar"}}
                  :other-data "preserved"}
          claims {:email "test@example.com"}
          result (jwt/create-auth-context context claims)]
      (is (= claims (get-in result [:request :identity])))
      (is (= "application/json" (get-in result [:request :headers "content-type"])))
      (is (= {:foo "bar"} (get-in result [:request :params])))
      (is (= "preserved" (:other-data result))))))

(deftest create-unauthorized-response-test
  (testing "creates proper 401 response"
    (let [response (jwt/create-unauthorized-response "Test message")]
      (is (= 401 (:status response)))
      (is (= "Test message" (:body response)))))
  
  (testing "handles different messages"
    (let [response (jwt/create-unauthorized-response "Token expired")]
      (is (= 401 (:status response)))
      (is (= "Token expired" (:body response))))))

(deftest auth-interceptor-test
  (testing "processes valid authorization header"
    (with-redefs [jwt/verify-google-jwt (fn [token] 
                                          (when (= token "valid-token")
                                            {:email "test@example.com"}))]
      (let [context {:request {:headers {"authorization" "Bearer valid-token"}}}
            result ((:enter jwt/auth-interceptor) context)]
        (is (= {:email "test@example.com"} (get-in result [:request :identity])))
        (is (nil? (:response result))))))
  
  (testing "rejects invalid token"
    (with-redefs [jwt/verify-google-jwt (constantly nil)]
      (let [context {:request {:headers {"authorization" "Bearer invalid-token"}}}
            result ((:enter jwt/auth-interceptor) context)]
        (is (= 401 (get-in result [:response :status])))
        (is (= "Invalid or expired token" (get-in result [:response :body]))))))
  
  (testing "rejects missing authorization header"
    (let [context {:request {:headers {}}}
          result ((:enter jwt/auth-interceptor) context)]
      (is (= 401 (get-in result [:response :status])))
      (is (= "Missing Authorization header" (get-in result [:response :body])))))
  
  (testing "rejects malformed authorization header"
    (let [context {:request {:headers {"authorization" "Basic not-bearer"}}}
          result ((:enter jwt/auth-interceptor) context)]
      (is (= 401 (get-in result [:response :status])))
      (is (= "Missing Authorization header" (get-in result [:response :body]))))))