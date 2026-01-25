require "securerandom"

module Api
  module V1
    class SessionsController < ApplicationController
      DEFAULT_QUESTION_COUNT = 10

      def create
        total = params.fetch(:total, DEFAULT_QUESTION_COUNT).to_i
        total = DEFAULT_QUESTION_COUNT if total <= 0

        question_ids = Place.order(Arel.sql("RANDOM()")).limit(total).pluck(:id)
        session_id = SecureRandom.uuid

        Rails.cache.write(cache_key(session_id), {
          question_ids: question_ids,
          current_index: 0,
          correct_count: 0,
          total: question_ids.length
        })

        render json: { session_id: session_id, total: question_ids.length }
      end

      private

      def cache_key(session_id)
        "quiz_session:#{session_id}"
      end
    end
  end
end
