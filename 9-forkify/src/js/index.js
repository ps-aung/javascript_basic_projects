import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/SearchView';
import * as recipeView from './views/RecipeView';
import * as listView from './views/ListView';
import * as likeView from './views/LikeView';
import { elements,renderLoader,clearloader } from './views/base';


/*Global state of app
* - Search Object
* - Current recipe object 
* - Shopping list Object
* - Linked recipes  */

const state = {};  

const controlSearch = async () => {
    //1 get query from view
    const  query = searchView.getInput();

    if(query){
        //2) New Search object and add to state
        state.Search = new Search(query);
        //3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            //4) search for recipes
            await state.Search.getResults();
            //5) render results on UI
            clearloader();
            searchView.renderResults(state.Search.result);
        } catch (error) {
            alert("Something wrong with the Search......!!");
        }
        
    }
}

elements.searchForm.addEventListener('submit',e=>{
    e.preventDefault();
    controlSearch();
})


elements.searchResPages.addEventListener('click',e=>{
    const btn = e.target.closest('.btn-inline');
    if(btn){
        const goToPage = parseInt(btn.dataset.goto,10);
        searchView.clearResults();
        searchView.renderResults(state.Search.result,goToPage);
    }
});

/* Recipe Controller */
const controlRecipe = async () => {
    //Get ID from URL
    const id = window.location.hash.replace('#','');

    if(id){
        
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highligh selected search item
        if(state.search) searchView.highlightSelected(id);

        //create new recipe object
        state.recipe = new Recipe(id);
        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
    
            // Render recipe
            clearloader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)                
                );
        } catch (error) {
             alert('Error processing Recipe!!');            
        }
       

    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/* List Controller */
const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

    // Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

/* Like Controller */

//Testing

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //user has not yet liked current recipe
    if(!state.likes.isLiked(currentID)){

        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        )
        //Toggle the like button
        likeView.toggleLikeBtn(true);
        //add like to UI List
        likeView.renderLike(newLike);
        //user has liked current recipe
    }else{
        //Remove like from the state
        state.likes.deleteLike(currentID);
        //Toggle the like button
        likeView.toggleLikeBtn(false);
        //Remove the like from UI list
        likeView.deleteLike(currentID);
    }
    likeView.toggleLikeMenu(state.likes.getNumLikes());
};

//  Resotre liked recipes on page load
window.addEventListener('load',()=>{
    state.likes = new Likes();

    //Resotre likes
    state.likes.readStorage();

    // Toggle like menu button
    likeView.toggleLikeMenu(state.likes.getNumLikes());

    //Render the existing likes
    state.likes.likes.forEach(like => likeView.renderLike(like));
})

//handling recipe button clicks 
elements.recipe.addEventListener('click',e=>{
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')){
        
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});



