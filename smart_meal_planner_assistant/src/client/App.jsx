import { useState } from "react";
import "./App.css";

function App() {

  const [data, setData] = useState('');
  const [itemList, setItemList] = useState([
    {id: 1, name: '', value: ''}
  ]);

  const handleChange = (val, index, type) => {
    let list = [...itemList];
    let obj = list[index]
    obj = {
      ...obj,
      [type]: val,
    }
    let updatedArr = [...list.slice(0, index), obj, ...list.slice(index+1)]
    setItemList(updatedArr)
  }

  const handleAdd = (index) => {
      let obj = {
        id: index+1, 
        name: '', 
        value: ''
      }
      setItemList([...itemList, obj])
  }
  
  const handleSubmit = async() => {
    if(itemList.length > 1){
      const url = 'http://localhost:8089/api/recipe/generate';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(itemList)
      })
      const result = await response.json(); 
      setData(result.result)
      if(result){
        setItemList([{id: 1, name: '', value: ''}])
      }
    }
  }

  return (
    <div className="App" style={{width: '100%', }}>
      <h2>Smart meal planner assistant</h2>
      <div style={{display: 'flex', flexDirection: 'row', height:'100%'}}>
      <div style={{width: '50%', border:'1px solid #C3C3C3', backgroundColor:'#FFF', display:'flex', alignItems:'center', justifyContent:'space-between', flexDirection:'column'}}>
        <div style={{height: '400px', overflow: 'auto'}}>
        {itemList?.map((item, index) => {
          return(
            <div key={index} style={{display:'flex', flexDirection:'row', alignItems:'center', paddingTop: '20px'}}>
              <input 
                type="text" 
                placeholder='Enter ingrediant name' 
                value={item.name} 
                onChange={(e) => handleChange(e.target.value, index, 'name')}
                style={{height: 30, width: 250, border: '1px solid #000', paddingLeft: '10px', marginRight: '50px', borderRadius: '5px'}}
              />
              <input 
                type="number" 
                placeholder='Enter value' 
                value={item.value} 
                onChange={(e) => handleChange(e.target.value, index, 'value')}
                style={{height: 30, width: 100, border: '1px solid #000', paddingLeft: '10px', borderRadius: '5px'}}
              />grams

              {itemList.length-1 <= index && <div onClick={() => handleAdd(index+1)} style={{marginLeft: '20px', cursor: 'pointer'}}>
                <h2 style={{}}>+</h2>
              </div>}
            </div>
          )
        })}
        </div>
        <div onClick={handleSubmit} style={{height: 50, backgroundColor:'#000', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '10px', borderRadius: '10px', width: 200, alignSelf:'center', marginBottom: '20px'}}>
          <h2 style={{color:'#FFF'}}>Submit</h2>
        </div>
      </div>
      <div style={{overflow: 'auto', width: '50%', border:'1px solid #C3C3C3', backgroundColor:'#FFF', height: '80vh'}}>
        <h3 >Your recipe</h3>
        {data ? 
        <p style={{alignItems:'left', display:'flex', padding: '20px', textAlign: 'left', lineHeight: 2, whiteSpace: 'pre-wrap'}}>{data}</p>
        :
        <p style={{paddingTop: '100px'}}>No data to display, Please add the list of ingrediants you are having.</p>
        }
        </div>
      </div>
      
    </div>
  );
}

export default App;
