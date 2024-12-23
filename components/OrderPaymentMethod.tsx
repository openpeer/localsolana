fetch(`/api/banks?currency_id=${currency!.id}`)
  .then((res) => res.json())
  .then((res) => res.data)
  // No error handling 