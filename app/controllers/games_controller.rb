# frozen_string_literal: true
class GamesController < ApplicationController
  def create
    new_game = Game.create(game_params)

    render json: new_game, status: :ok
  end

  def game_params
    params.require(:game).permit(:name)
  end
end
