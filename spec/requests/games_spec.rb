# frozen_string_literal: true
require 'rails_helper'

describe 'Games API' do
  let(:name) { 'test' }
  let(:avatar) { 'avatar' }

  it 'creates a new game' do
    post '/games', params: { game: { name: name } }

    response_body = JSON.parse(response.body, symbolize_names: true)
    expect(response).to be_success
    expect(response_body[:data][:attributes][:name]).to eq(Game.last.name)
  end
end
