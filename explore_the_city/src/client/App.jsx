import { useState } from "react";
import "./App.css";
function App() {

  const [data, setData] = useState('');
  const [cityName, setCityName] = useState('');
  const [hotelName, setHotelName] = useState('');
  
  const handleSubmit = async() => {
    if(cityName != '' && hotelName != ''){
      const url = 'http://localhost:8079/api/location-explorer/generate';
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({city: cityName, hotel: hotelName})
      })
      const result = await response.json(); 
      setData(result?.result?.sightseeing_locations)
      // if(result){
      //   setCityName('')
      //   setHotelName('')
      // }
    }
  }
  console.log(data, 'dslkfjs')

  return (
    <div className="App" style={{width: '100%', }}>
      <h2>Explore the city</h2>
      <div style={{border:'1px solid #C3C3C3', backgroundColor:'#FFF', display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'column', borderRadius: '10px'}}>
        <div style={{height: '500px', overflow: 'auto', alignItems:'center', display:'flex', flexDirection: 'column'}}>
            <div style={{display:'flex', flexDirection:'row', alignItems:'center', paddingTop: '40px'}}>
              <input 
                type="text" 
                placeholder='Please enter the city name' 
                value={cityName} 
                onChange={(e) => setCityName(e.target.value)}
                style={{height: 40, width: 250, border: '1px solid #FE3101', paddingLeft: '10px', borderRadius: '5px'}}
              />
              <input 
                type="text" 
                placeholder='Please enter the hotel name' 
                value={hotelName} 
                onChange={(e) => setHotelName(e.target.value)}
                style={{height: 40, width: 250, border: '1px solid #FE3101', paddingLeft: '10px', borderRadius: '5px', marginLeft: '20px'}}
              />

              <div onClick={handleSubmit} style={{height: 40, backgroundColor:'#FEF4F1', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '10px', width: 150, alignSelf:'center', marginLeft: '20px', border: '1px solid #FE3101'}}>
                <h3 style={{color:'#000', fontWeight: 500}}>Submit</h3>
              </div>
            </div>
            {data?.length > 0 ? 
            <div style={{width: '99%', height: '100%', display:'flex', flexDirection:'row', flexWrap: 'wrap', marginTop: '20px', marginBottom: '20px', justifyContent:'space-around', marginLeft: '10px'}}>
              {data?.map((item, index) => {
                return(
                  <div key={index} style={{height: 150, width: 300, border: '1px solid #fff', backgroundColor:'#FEF4F1', margin: '5px', borderRadius: '10px', padding: '10px'}}>
                    <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
                    <h4 style={{}}>{item.place_name}</h4>
                    <h4 style={{}}>{item.distance}</h4>
                    </div>
                    <h5 style={{fontWeight: 400}}>{item.description}</h5>
                  </div>
                )
              })}
            </div>
            :
              <h4 style={{textAlign:'center', paddingTop: '150px'}}>No data to display, Please input the city and hotel names above.! </h4>
            }
        </div>
      </div>
      </div>
      
  );
}

export default App;