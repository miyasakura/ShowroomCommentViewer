require 'sinatra'
require 'open-uri'

get '/proxy' do
  url = params[:url]
  response['Access-Control-Allow-Origin'] = '*'
  open(url).read
end
