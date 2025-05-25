(ns horti.jwt
  (:require [clojure.string :as str]
            [com.github.sikt-no.clj-jwt :as clj-jwt]))

(def google-jwks-url "https://www.googleapis.com/oauth2/v3/certs")

(defn verify-google-jwt 
  "Verifies a Google JWT token and returns the claims if valid, nil otherwise"
  [token]
  (try
    (clj-jwt/unsign google-jwks-url token)
    (catch Exception e
      (println "JWT verification failed:" e)
      nil)))

(defn extract-bearer-token
  "Extracts the token from an Authorization header string"
  [authorization-header]
  (when (and authorization-header (str/starts-with? authorization-header "Bearer "))
    (subs authorization-header 7)))

(defn create-auth-context
  "Creates auth context with identity when token is valid"
  [context claims]
  (assoc-in context [:request :identity] claims))

(defn create-unauthorized-response
  "Creates an unauthorized response"
  [message]
  {:status 401 :body message})

(def auth-interceptor
  {:name ::auth
   :enter
   (fn [context]
     (let [authz (get-in context [:request :headers "authorization"])
           token (extract-bearer-token authz)]
       (if token
         (if-let [claims (verify-google-jwt token)]
           (create-auth-context context claims)
           (assoc context :response (create-unauthorized-response "Invalid or expired token")))
         (assoc context :response (create-unauthorized-response "Missing Authorization header")))))}) 