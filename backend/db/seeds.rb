# db/seeds.rb
require "csv"

puts "Importing Hokkaido municipalities..."

csv_path = Rails.root.join("db/data/shichoson.csv")

Place.destroy_all

CSV.foreach(csv_path, headers: true, encoding: "CP932") do |row|
  name = row["市町村名"]
  reading = row["かな"]

  difficulty =
    if name.end_with?("市")
      1
    elsif name.end_with?("町")
      2
    elsif name.end_with?("村")
      3
    else
      2
    end

  Place.create!(
    name: name,
    reading: reading,
    difficulty: difficulty
  )
end

puts "Seed completed: #{Place.count} places imported!"