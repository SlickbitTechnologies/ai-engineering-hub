import { openai } from "../utils.mjs";

export const fetchRecipe = async(req, res) => {
    try{
        const recipeList = req.body;
        let prompt = `You are kitchen assistant. 
        You are asked to provide a recipe for the following ingredients: 
        ${JSON.stringify(recipeList)}.
        and take value in grams from the recipe list.
        Dont send the recipe list which is provided by the server and response should be in text format
        `;
        const response = await openai.chat.completions.create({
            messages: [
              { role: "system", content: 'text' },
              { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo-16k",
          });
        const result = response.choices[0].message.content.trim();
        return res.status(200).json({message: 'Recipe fetched successfully', result})
    }
    catch(err){
        console.log(err)
        res.status(500).json({message: 'Failed to fetch recipe'})
        throw err;
    }
}  