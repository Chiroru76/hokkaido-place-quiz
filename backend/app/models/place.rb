class Place < ApplicationRecord
  validates :name, presence: true
  validates :reading, presence: true
  validates :difficulty, inclusion: { in: 1..3 }, allow_nil: true
end
