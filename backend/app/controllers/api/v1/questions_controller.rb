module Api
  module V1
    class QuestionsController < ApplicationController
      def next
        session = load_session!
        return unless session
        place = current_place(session)

        if place.nil?
          render json: { completed: true, current: session[:current_index], total: session[:total] }
          return
        end

        render json: {
          question_id: place.id,
          session_id: session_id,
          name: place.name,
          difficulty: place.difficulty,
          current: session[:current_index] + 1,
          total: session[:total]
        }
      end

      def answer
        session = load_session!
        return unless session
        place = current_place(session)

        if place.nil?
          render json: { completed: true, current: session[:current_index], total: session[:total] }
          return
        end

        if place.id != params[:id].to_i
          render json: { error: "question_id does not match current question" }, status: :unprocessable_entity
          return
        end

        correct = normalize(params[:answer]) == normalize(place.reading)

        session[:correct_count] += 1 if correct
        session[:current_index] += 1
        Rails.cache.write(cache_key(session_id), session)

        render json: correct ? { correct: true } : { correct: false, correct_reading: place.reading }
      end

      private

      def session_id
        params[:session_id].to_s
      end

      def load_session!
        session = Rails.cache.read(cache_key(session_id))
        return session.with_indifferent_access if session.present?

        render json: { error: "session not found" }, status: :not_found
        nil
      end

      def current_place(session)
        question_id = session[:question_ids][session[:current_index]]
        return nil unless question_id

        Place.find_by(id: question_id)
      end

      def cache_key(session_id)
        "quiz_session:#{session_id}"
      end

      def normalize(value)
        value.to_s.strip.tr("ァ-ン", "ぁ-ん").gsub(/\s+/, "")
      end
    end
  end
end
