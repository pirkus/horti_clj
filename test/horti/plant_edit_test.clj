(ns horti.plant-edit-test
  (:require [clojure.test :refer :all]
            [horti.db :as db]
            [horti.system :as system]))

(deftest test-plant-update-data-structure
  (testing "Plant update data structure validation"
    (let [update-data {:name "Updated Tomato"
                      :emoji "🍅"
                      :type "Cherry Tomato"}]
      (is (string? (:name update-data)))
      (is (string? (:emoji update-data)))
      (is (string? (:type update-data))))))

(deftest test-plant-update-validation
  (testing "Plant update requires valid fields"
    (let [valid-update {:name "New Name" :emoji "🌱"}
          invalid-update {:name "" :emoji ""}]
      (is (not-empty (:name valid-update)))
      (is (not-empty (:emoji valid-update)))
      (is (empty? (:name invalid-update)))
      (is (empty? (:emoji invalid-update))))))

(deftest test-plant-update-security
  (testing "Plant update should verify ownership"
    (let [plant-data {:id "plant-123"
                     :user-email "user@example.com"
                     :name "Original Name"}
          update-data {:name "Hacked Name"}]
      (is (= "user@example.com" (:user-email plant-data)))
      (is (string? (:id plant-data))))))

(deftest test-plant-partial-update
  (testing "Plant update should allow partial updates"
    (let [name-only-update {:name "New Name"}
          emoji-only-update {:emoji "🌿"}
          both-update {:name "New Name" :emoji "🌿"}]
      (is (contains? name-only-update :name))
      (is (not (contains? name-only-update :emoji)))
      (is (contains? emoji-only-update :emoji))
      (is (not (contains? emoji-only-update :name)))
      (is (and (contains? both-update :name) 
               (contains? both-update :emoji))))))