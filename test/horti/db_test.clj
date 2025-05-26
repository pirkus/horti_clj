(ns horti.db-test
  (:require [clojure.test :refer :all]
            [horti.db :as db]
            [horti.test-utils :as test-utils :refer [*test-db*]]))

(def test-user-email "test@example.com")
(def other-user-email "other@example.com")

(use-fixtures :once (test-utils/setup-test-db-fixture "horti-test"))
(use-fixtures :each test-utils/clean-db-fixture)

;; Canvas Tests
(deftest test-canvas-creation
  (testing "Creating a new canvas"
    (let [canvas-data {:name "Test Garden"
                      :description "My test garden"
                      :width 1000
                      :height 800}
          result (db/save-canvas *test-db* test-user-email canvas-data)]
      (is (contains? result :result))
      (is (not (contains? result :error)))
      (let [saved (:result result)]
        (is (= "Test Garden" (:name saved)))
        (is (= test-user-email (:user-email saved)))
        (is (instance? java.util.Date (:created-at saved)))))))

(deftest test-canvas-retrieval
  (testing "Getting user canvases"
    ;; Create multiple canvases
    (db/save-canvas *test-db* test-user-email {:name "Garden 1"})
    (db/save-canvas *test-db* test-user-email {:name "Garden 2"})
    (db/save-canvas *test-db* other-user-email {:name "Other Garden"})
    
    (let [canvases (db/get-user-canvases *test-db* test-user-email)]
      (is (= 2 (count canvases)))
      (is (every? #(= test-user-email (:user-email %)) canvases))
      (is (not-any? #(= "Other Garden" (:name %)) canvases)))))

(deftest test-canvas-archiving
  (testing "Archiving and unarchiving canvases"
    (let [{:keys [result]} (db/save-canvas *test-db* test-user-email {:name "To Archive"})
          canvas-id (str (:_id result))]
      
      ;; Archive the canvas
      (let [archive-result (db/archive-canvas *test-db* canvas-id test-user-email true)]
        (is (contains? archive-result :result)))
      
      ;; Verify it's not in active canvases
      (let [active (db/get-user-canvases *test-db* test-user-email)]
        (is (= 0 (count active))))
      
      ;; Verify it's in archived canvases
      (let [archived (db/get-user-archived-canvases *test-db* test-user-email)]
        (is (= 1 (count archived)))
        (is (= "To Archive" (:name (first archived))))))))

(deftest test-canvas-security
  (testing "Canvas operations respect user ownership"
    (let [{:keys [result]} (db/save-canvas *test-db* test-user-email {:name "My Canvas"})
          canvas-id (str (:_id result))]
      
      ;; Try to update as different user
      (let [update-result (db/update-canvas *test-db* canvas-id other-user-email {:name "Hacked"})]
        (is (contains? update-result :error))
        (is (= "Canvas not found or access denied" (:error update-result))))
      
      ;; Try to archive as different user
      (let [archive-result (db/archive-canvas *test-db* canvas-id other-user-email true)]
        (is (contains? archive-result :error))
        (is (= "Canvas not found or access denied" (:error archive-result)))))))

;; Plant Tests
(deftest test-plant-creation
  (testing "Creating plants with canvas association"
    (let [{:keys [result]} (db/save-canvas *test-db* test-user-email {:name "Garden"})
          canvas-id (str (:_id result))
          plant-data {:name "Tomato"
                     :type "Cherry Tomato"
                     :emoji "🍅"
                     :x 100
                     :y 200}
          plant-result (db/save-canvas-plant *test-db* test-user-email canvas-id plant-data)]
      (is (contains? plant-result :result))
      (let [saved (:result plant-result)]
        (is (= "Tomato" (:name saved)))
        (is (= canvas-id (:canvas-id saved)))
        (is (= test-user-email (:user-email saved)))))))

(deftest test-plant-retrieval
  (testing "Getting plants for a canvas"
    (let [{:keys [result]} (db/save-canvas *test-db* test-user-email {:name "Garden"})
          canvas-id (str (:_id result))]
      
      ;; Create plants
      (db/save-canvas-plant *test-db* test-user-email canvas-id {:name "Plant 1" :x 100 :y 100})
      (db/save-canvas-plant *test-db* test-user-email canvas-id {:name "Plant 2" :x 200 :y 200})
      (db/save-canvas-plant *test-db* other-user-email canvas-id {:name "Wrong User Plant" :x 300 :y 300})
      
      (let [plants (db/get-canvas-plants *test-db* canvas-id test-user-email)]
        (is (= 2 (count plants)))
        (is (every? #(= test-user-email (:user-email %)) plants))
        (is (not-any? #(= "Wrong User Plant" (:name %)) plants))))))

(deftest test-plant-update
  (testing "Updating plant data"
    (let [{:keys [result]} (db/save-plant *test-db* test-user-email {:name "Original" :emoji "🌱"})
          plant-id (str (:_id result))]
      
      ;; Update the plant
      (db/update-document *test-db* "plants" plant-id {:name "Updated" :emoji "🌿"})
      
      ;; Verify update
      (let [updated (db/find-document-by-id *test-db* "plants" plant-id)]
        (is (= "Updated" (:name updated)))
        (is (= "🌿" (:emoji updated)))))))

(deftest test-plant-deletion
  (testing "Deleting plants"
    (let [{:keys [result]} (db/save-plant *test-db* test-user-email {:name "To Delete"})
          plant-id (str (:_id result))]
      
      ;; Delete the plant
      (db/delete-document *test-db* "plants" plant-id)
      
      ;; Verify deletion
      (let [deleted (db/find-document-by-id *test-db* "plants" plant-id)]
        (is (nil? deleted))))))

;; Canvas dimension tests
(deftest test-canvas-dimension-update
  (testing "Moving plants when canvas dimensions change"
    (let [{:keys [result]} (db/save-canvas *test-db* test-user-email {:name "Garden" :width 800 :height 600})
          canvas-id (str (:_id result))]
      
      ;; Create plants near edges
      (db/save-canvas-plant *test-db* test-user-email canvas-id {:name "Plant 1" :x 790 :y 590})
      (db/save-canvas-plant *test-db* test-user-email canvas-id {:name "Plant 2" :x 400 :y 300})
      
      ;; Shrink canvas
      (let [move-result (db/move-plants-inside-canvas *test-db* canvas-id 600 400 test-user-email)]
        (is (contains? move-result :result))
        (is (= 1 (:result move-result)))) ; Only Plant 1 should move
      
      ;; Verify plant positions
      (let [plants (db/get-canvas-plants *test-db* canvas-id test-user-email)
            plant1 (first (filter #(= "Plant 1" (:name %)) plants))
            plant2 (first (filter #(= "Plant 2" (:name %)) plants))]
        (is (<= (:x plant1) 570)) ; 600 - 30
        (is (<= (:y plant1) 370)) ; 400 - 30
        (is (= 400 (:x plant2)))   ; Unchanged
        (is (= 300 (:y plant2)))))))  ; Unchanged

;; Metrics Tests
(deftest test-metrics-creation
  (testing "Creating daily metrics for plants"
    (let [{:keys [result]} (db/save-plant *test-db* test-user-email {:name "Hydro Plant"})
          plant-id (str (:_id result))
          metrics-data {:date "2024-05-26"
                       :ec 1.8
                       :ph 6.2
                       :notes "Looking healthy"}
          metrics-result (db/save-daily-metrics *test-db* test-user-email plant-id metrics-data)]
      (is (contains? metrics-result :result))
      (let [saved (:result metrics-result)]
        (is (= plant-id (:plant-id saved)))
        (is (= 1.8 (:ec saved)))
        (is (= 6.2 (:ph saved)))))))

(deftest test-metrics-retrieval
  (testing "Getting metrics with date filtering"
    (let [{:keys [result]} (db/save-plant *test-db* test-user-email {:name "Plant"})
          plant-id (str (:_id result))]
      
      ;; Create metrics for different dates
      (db/save-daily-metrics *test-db* test-user-email plant-id {:date "2024-05-24" :ec 1.5})
      (db/save-daily-metrics *test-db* test-user-email plant-id {:date "2024-05-25" :ec 1.6})
      (db/save-daily-metrics *test-db* test-user-email plant-id {:date "2024-05-26" :ec 1.7})
      (db/save-daily-metrics *test-db* other-user-email plant-id {:date "2024-05-26" :ec 9.9})
      
      ;; Get all metrics
      (let [all-metrics (db/get-plant-metrics *test-db* plant-id nil nil test-user-email)]
        (is (= 3 (count all-metrics)))
        (is (every? #(= test-user-email (:user-email %)) all-metrics)))
      
      ;; Get metrics with date range
      (let [filtered (db/get-plant-metrics *test-db* plant-id "2024-05-25" "2024-05-26" test-user-email)]
        (is (= 2 (count filtered)))
        (is (not-any? #(= "2024-05-24" (:date %)) filtered))))))

(deftest test-metrics-operations
  (testing "Daily metrics operations"
    (let [plant-result (db/save-plant *test-db* test-user-email {:name "Metrics Plant" :x 100 :y 100})
          plant-id (str (:_id (:result plant-result)))
          metrics-data {:date "2024-05-26"
                       :ec 1.8
                       :ph 6.2
                       :notes "Test metrics"}
          metrics-result (db/save-daily-metrics *test-db* test-user-email plant-id metrics-data)]
      
                
      ;; Check metrics were saved
      (is (contains? metrics-result :result))
      
      ;; Retrieve metrics
      (let [retrieved (db/get-plant-metrics *test-db* plant-id nil nil test-user-email)]
        
        (is (= 1 (count retrieved)))
        (is (= 1.8 (:ec (first retrieved))))
        (is (= 6.2 (:ph (first retrieved))))
        (is (= "Test metrics" (:notes (first retrieved)))))
      
      ;; Test date filtering
      (let [filtered (db/get-plant-metrics *test-db* plant-id "2024-05-25" "2024-05-27" test-user-email)]
        (is (= 1 (count filtered))))
      
      (let [filtered (db/get-plant-metrics *test-db* plant-id "2024-05-27" "2024-05-28" test-user-email)]
        (is (= 0 (count filtered)))))))

;; User Profile Tests
(deftest test-user-profile
  (testing "User profile creation and update"
    ;; Create new profile
    (let [profile {:name "Test User" :preferences {:theme "dark"}}
          create-result (db/save-user-profile *test-db* test-user-email profile)]
      (is (contains? create-result :result)))
    
    ;; Update existing profile
    (let [update {:name "Updated User" :preferences {:theme "light"}}
          update-result (db/save-user-profile *test-db* test-user-email update)]
      (is (contains? update-result :result)))
    
    ;; Verify update
    (let [users (db/find-documents *test-db* "users" {:email test-user-email})]
      (is (= 1 (count users)))
      (is (= "Updated User" (:name (first users)))))))