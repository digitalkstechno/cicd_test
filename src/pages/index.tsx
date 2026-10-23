import React from 'react'

const index = () => {
  let data = [10,20,30,40,50]
  return (
    <div>index
    {data.map((el,index) => {
      return (
        <div key={index}>{el}</div>
      )
    })}
    </div>
  )
}

export default index;