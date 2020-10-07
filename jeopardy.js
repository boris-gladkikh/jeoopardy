const BASE_URL = "http://jservice.io/api";

// categories:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

// * get category Ids - wrote a random number generator. since I need 6 categories, the function fills array with 6 
// * unique category id's within the range of id's in the api (which i find to be around 18000, currently)
// * so rather than doing a 'random' request, it gets category values locally.

function getCategoryIds() {
    let arrayOfCategoryIds = [];
    for (let i = 0; i < 6; i++) {
        let randomNumberGen = Math.floor(Math.random() * 10000);
        if (!(arrayOfCategoryIds.includes(randomNumberGen)) && randomNumberGen < 18000) {
            arrayOfCategoryIds.push(randomNumberGen);
        }
    }
    return arrayOfCategoryIds;

}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */


// requests category by ID, creates new object with proper title/clues format.

async function getCategory(catId) {
    let categoryObject = {};
    let responseCategory = await axios.get(`${BASE_URL}/category?id=${catId}`);
    categoryObject.title = responseCategory.data.title;
    let cluesResponseArray = responseCategory.data.clues;
    let properlyFormattedCluesArray = populateCategoryCluesArray(cluesResponseArray);
    categoryObject.clues = properlyFormattedCluesArray;
    return categoryObject;

}

// helper function to format clues reponse into proper format (question, answer, showing)

function populateCategoryCluesArray(arrayOfObjects) {
    let arrayOfCluesInProperFormat = [];
    for (let i = 0; i < arrayOfObjects.length; i++) {
        let currentClueObj = {};
        currentClueObj.question = arrayOfObjects[i].question;
        currentClueObj.answer = arrayOfObjects[i].answer;
        currentClueObj.showing = null;
        arrayOfCluesInProperFormat.push(currentClueObj);

    }
    return arrayOfCluesInProperFormat;
};



//===================================================================================

//UI section

const $gameBoard = $(".game-board");
const $startGameButton = $(".new-game-button");
const $gameTable = $(".jeopardy-table");
const $gameCategoryRow = $(".category-row");
const $gameQuestionsBody = $(".game-table-body");
const $gameCard = $(".game-card");
const $loadScreen = $(".load-screen");


/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM-QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    let categoryIdArray = getCategoryIds();
    let categoriesArray = []
    for (let i = 0; i < categoryIdArray.length; i++) {
        let categoryObject = getCategory(categoryIdArray[i]);
        categoriesArray.push(await categoryObject);
        categories.push(await categoryObject);
    }
    populateHeadersInGameTable(categoriesArray);
    populateQuestionsInGameTable(categoriesArray);
    attachDataToCells(categoriesArray);
}

//helper function to create and populate header row in table with categories

function populateHeadersInGameTable(array) {
    for (let i = 0; i < array.length; i++) {
        let $generatedGameTableCategoriesHTML =
            $(`<td class=" category-card category ${i}">${String(array[i].title)}</td>`)
        $gameCategoryRow.append($generatedGameTableCategoriesHTML);
    }
};

//helper function to populate table body with question data cells that have a unique id from 0 to 29

function populateQuestionsInGameTable(array) {
    let idCounter = 0
    for (let i = 0; i < array.length - 1; i++) {
        let generatedGameTableQuestionsHTML =
            $(`<tr class=" question ${i}">
    <td class="game-card" id="${idCounter}">?</td>
    <td class="game-card" id="${idCounter + 1}">?</td>
    <td class="game-card" id="${idCounter + 2}">?</td>
    <td class="game-card" id="${idCounter + 3}">?</td>
    <td class="game-card" id="${idCounter + 4}">?</td>
    <td class="game-card" id="${idCounter + 5}">?</td>
    </tr>`);
        $gameQuestionsBody.append(generatedGameTableQuestionsHTML);
        idCounter += 6;
    }
};

//function uses unique id's to attach the question and category data to each cell!

function attachDataToCells(array) {
    let categoryIndex = 0;
    let clueIndex = 0;
    for (let i = 0; i <= 29; i++) {
        $(`#${i}`).data(array[categoryIndex].clues[clueIndex]);
        categoryIndex++;
        if (categoryIndex >= 6) {
            categoryIndex = 0;
            clueIndex++;
        }
        // if (clueIndex >= 10) {
        //   clueIndex = 9;
        // }
    }
}



/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if curerntly "answer", ignore click
 * */


function handleClick(evt) {
    let $currentEventData = $(evt.target).data()
    if ($currentEventData.showing === null) {
        $(evt.target).text($currentEventData.question);
        $currentEventData.showing = "question";
    } else if ($currentEventData.showing === "question") {
        $(evt.target).text(String($currentEventData.answer));
        $currentEventData.showing = "answer";
        $(evt.target).removeClass("game-card");
        $(evt.target).addClass("game-card-solved");


        // console.log($(evt.target).data());

    }
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $loadScreen.show();
    $startGameButton.text("Loading...");
    $gameCategoryRow.empty();
    $gameQuestionsBody.empty();
    $gameBoard.hide();


}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $loadScreen.hide()
    $gameBoard.show();

}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */


async function setupAndStart() {
    showLoadingView();

    $(document).ready(async function() {
        await fillTable();
        $startGameButton.text("Restart");
        hideLoadingView();

    });


}



/** On click of start / restart button, set up game. */


// Clicking the start game button launches the set up and start function

$startGameButton.on("click", setupAndStart);

//clicking each clue executes the handleclick function 

$gameBoard.on("click", ".game-card", handleClick);

