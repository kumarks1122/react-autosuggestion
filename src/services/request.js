const fetchApi = async (endPoint, method = 'get', payload = {}, callback) => {
  const apiConfig = {
    url: "http://www.mocky.io/v2",
  };

  await fetch(`${apiConfig.url}${endPoint}`,{
    method,
    headers: {
      "Content-Type": "application/json"
    }
  }).then((res) => res.json()).then(callback)
}

export default fetchApi