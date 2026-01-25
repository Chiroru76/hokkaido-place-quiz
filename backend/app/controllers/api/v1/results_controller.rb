module Api
  module V1
    class ResultsController < ApplicationController
      def show
        session_id = params[:id].to_s
        session = Rails.cache.read(cache_key(session_id))
        unless session
          render json: { error: "session not found" }, status: :not_found
          return
        end

        session = session.with_indifferent_access

        total = session[:total].to_i
        correct_count = session[:correct_count].to_i
        accuracy = total.positive? ? ((correct_count.to_f / total) * 100).round(2) : 0

        render json: {
          session_id: session_id,
          total_questions: total,
          correct_answers: correct_count,
          accuracy: accuracy
        }
      end

      private

      def cache_key(session_id)
        "quiz_session:#{session_id}"
      end
    end
  end
end
