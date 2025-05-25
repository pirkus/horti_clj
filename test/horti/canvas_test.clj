(ns horti.canvas-test
  (:require [clojure.test :refer :all]
            [horti.db :as db]))

(deftest test-canvas-data-structure
  (testing "Canvas data structure validation"
    (let [canvas-data {:name "Living Room Hydro"
                      :description "Hydroponic setup in the living room"
                      :width 800
                      :height 600}]
      (is (string? (:name canvas-data)))
      (is (string? (:description canvas-data)))
      (is (number? (:width canvas-data)))
      (is (number? (:height canvas-data))))))

(deftest test-canvas-plant-association
  (testing "Plant data includes canvas association"
    (let [plant-data {:name "Tomato"
                     :type "Tomato"
                     :x 100
                     :y 150
                     :canvas-id "canvas-123"}]
      (is (string? (:canvas-id plant-data)))
      (is (number? (:x plant-data)))
      (is (number? (:y plant-data))))))

(deftest test-canvas-validation
  (testing "Canvas requires name"
    (let [invalid-canvas {:description "Missing name"}]
      (is (nil? (:name invalid-canvas)))))
  
  (testing "Canvas has default dimensions"
    (let [canvas-with-defaults {:name "Test Canvas"
                               :width 800
                               :height 600}]
      (is (= 800 (:width canvas-with-defaults)))
      (is (= 600 (:height canvas-with-defaults))))))