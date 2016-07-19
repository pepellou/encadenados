# frozen_string_literal: true
class GamesController < ApplicationController
  def create
    new_game = Game.create(game_params)

    render json: JSONAPI::Serializer.serialize(new_game), status: :ok
  end

  def game_params
    params.require(:game).permit(:name)
  end
end
