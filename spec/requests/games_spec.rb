require 'rails_helper'

describe 'Games API' do
  let(:name) { 'test' }

  it 'creates a new game' do
    post '/games', game: { name: name }

    created_game = JSON.parse(response.body, symbolize_names: true)
    expect(response).to be_success
    expect(created_game[:name]).to eq(name)
  end

end
