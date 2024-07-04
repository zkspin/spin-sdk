use crate::definition::RustGameState;
use crate::lcg_rand_gen::LCGRandGen;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

pub static GAME_STATE: Lazy<Mutex<RustGameState>> = Lazy::new(|| Mutex::new(RustGameState::new()));

/* STATEFUL FUNCTIONS This defines the initialization of the game
*
* This is where you can initialize your gameplay.
* The function takes in a `seed` which could help you generate randomness.
* Note, please generate randomness purely deterministically from this seed.
*/
#[wasm_bindgen]
pub fn initialize_game(seed: u64) -> () {
    // IMPLEMENT THIS FUNCTION
    let mut game_state = GAME_STATE.lock().unwrap();

    game_state.seed = seed;
    game_state.score = 0;

    const MINE_COUNT: u64 = 300;

    game_state.mine_positions = HashMap::new();

    let mut lcg = LCGRandGen::new(seed);

    for _ in 0..MINE_COUNT {
        let mine_position = lcg.randint_range(0, 80 * 30);
        game_state.mine_positions.insert(mine_position, 1);
    }
}

/* STATEFUL FUNCTIONS This is defines the logic when player moves one step/entering one command

The keyboard inputs will be passed as keyCode in Js.

The keyCode are representations of the keys pressed.

See a mapping of the keyCode to the key pressed: **https://www.toptal.com/developers/keycode/table**

*/
#[wasm_bindgen]
pub fn step(keyCode: u64) -> () {
    // IMPLEMENT THIS FUNCTION
    let mut game_state = GAME_STATE.lock().unwrap();

    match keyCode {
        // KeyW
        87 => {
            if (game_state.player_position_y > 0) {
                game_state.player_position_y -= 1;
            }
        }
        // KeyA
        65 => {
            if (game_state.player_position_x > 0) {
                game_state.player_position_x -= 1;
            }
        }
        // KeyS
        83 => {
            if (game_state.player_position_y < 29) {
                game_state.player_position_y += 1;
            }
        }
        // KeyD
        68 => {
            if (game_state.player_position_x < 79) {
                game_state.player_position_x += 1;
            }
        }
        _ => {
            // Do nothing
        }
    };

    if (game_state
        .mine_positions
        .contains_key(&(game_state.player_position_y * 80 + game_state.player_position_x))
        && game_state.score > 0)
    {
        game_state.score -= 1;
    } else {
        game_state.score += 1;
    }
}

/* PURE FUNCTIONS This function returns the game state, but parse into Json, so can be used in Javascript
* This is where you'll display back to the user. The string you return should be less or equal to 2400 in length.
* If the size is less than 2400, the rest of the string is padding with `space` until size is 2400.
*/
#[wasm_bindgen]
pub fn get_game_state() -> String {
    // REWRITE THIS TO RETURN A STRING TO DISPLAY
    let game = _get_game_state();
    let mut display_string = String::new();

    for i in 0..30 {
        for j in 0..80 {
            if game.player_position_x == j && game.player_position_y == i {
                display_string.push('P');
            } else {
                let is_mine = game.mine_positions.contains_key(&(i * 80 + j));
                if is_mine {
                    display_string.push('M');
                } else {
                    display_string.push(' ');
                }
            }
        }
    }
    display_string
}

#[wasm_bindgen]
pub fn get_game_score() -> u64 {
    let game = _get_game_state();
    game.score
}

/* PURE FUNCTION This function returns the game state, to be used in Rust and Zkmain */
pub fn _get_game_state() -> RustGameState {
    let game = GAME_STATE.lock().unwrap().clone();
    return game;
}
