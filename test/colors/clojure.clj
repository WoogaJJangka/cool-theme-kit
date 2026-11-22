; 한글 주석
(ns demo.core
  (:require [clojure.string :as str]))

(def max-size 10)

(defn greet
  "Docstring of greet"
  [name times]
  (str/join (repeat times (str "Hello " name "\n"))))

(println (greet "하나" 2) nil true :key 3.5 #"\d+")
