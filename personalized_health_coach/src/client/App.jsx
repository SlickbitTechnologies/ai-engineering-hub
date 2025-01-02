import { useState } from "react";
import "./App.css";
function App() {

  const [userData, setUserData] = useState({age: '', height: '', weight: '', requirment: ''});
  const [data, setData] = useState('');

  const handleChange = (val, key) => {
    let obj = userData
    obj = {
      ...obj,
      [key]: val
    }
    setUserData(obj)
  }
  
  const handleSubmit = async() => {
    if(true){
      const url = 'http://localhost:8099/api/healthCoach/generate';
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(userData)
      })
      const result = await response.json(); 
      setData(result.result)
      if(result){
        setUserData({age: '', height: '', weight: '', requirment: ''})
      }
    }
  }

  return (
    <div className="App" style={{width: '100%', }}>
      <h2>Pesonalized health coach</h2>
      <div style={{border:'1px solid #C3C3C3', backgroundColor:'#FFF', display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'column', borderRadius: '10px'}}>
        <div style={{height: '420px', overflow: 'auto', alignItems:'center', display:'flex', flexDirection: 'column'}}>
            <div style={{display:'flex', flexDirection:'row', alignItems:'center', paddingTop: '40px'}}>
              <input 
                type="number" 
                placeholder='Please enter Your age' 
                value={userData.age} 
                onChange={(e) => handleChange(e.target.value, 'age')}
                style={{height: 30, width: 200, border: '1px solid #000', paddingLeft: '10px', borderRadius: '5px'}}
              />
              <input 
                type="number" 
                placeholder='Please enter Your height' 
                value={userData.height} 
                onChange={(e) => handleChange(e.target.value, 'height')}
                style={{height: 30, width: 200, border: '1px solid #000', paddingLeft: '10px', borderRadius: '5px', marginLeft: '50px'}}
              />cms
              <input 
                type="number" 
                placeholder='Please enter Your weight' 
                value={userData.weight} 
                onChange={(e) => handleChange(e.target.value, 'weight')}
                style={{height: 30, width: 200, border: '1px solid #000', paddingLeft: '10px', borderRadius: '5px', marginLeft: '50px'}}
              />kgs

              <input 
                type="text" 
                placeholder='Please mention your requirment' 
                value={userData.requirment} 
                onChange={(e) => handleChange(e.target.value, 'requirment')}
                style={{height: 30, width: 200, border: '1px solid #000', paddingLeft: '10px', borderRadius: '5px', marginLeft: '50px'}}
              />
            </div>
            <p style={{textAlign:'left', padding: '20px', whiteSpace: 'pre-wrap'}}>{data}</p>
        </div>
        <div onClick={handleSubmit} style={{height: 50, backgroundColor:'#000', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px', borderRadius: '10px', width: 200, alignSelf:'center', marginBottom: '20px'}}>
          <h2 style={{color:'#FFF'}}>Submit</h2>
        </div>
      </div>
      </div>
      
  );
}

export default App;
