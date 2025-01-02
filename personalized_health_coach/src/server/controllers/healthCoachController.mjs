import { openai } from "../utils.mjs";

export const fetchHealthCoachData = async(req, res) => {
    try{
        const userData = req.body;
        console.log(req.body, 'dlskfhdjksf')
        let prompt = `You are personal health coach assistant. 
        You are asked to provide a 3 days diet and gym plan for the following person data: 
        ${JSON.stringify(userData)}.
        and take value in heigth as centimeters and weight as kgs from the userData list.
        Response should be in text format`;

        const response = await openai.chat.completions.create({
            messages: [
              { role: "system", content: 'text' },
              { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo-16k",
          });
        const result = response.choices[0].message.content.trim();
        return res.status(200).json({message: 'Diet information fetched successfully', result})
    }
    catch(err){
        console.log(err)
        res.status(500).json({message: 'Failed to fetch diet information'})
        throw err;
    }
}  