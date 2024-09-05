use crate::definition::SpinGameStates;
use crate::spin::SpinGame;
use crate::spin::SpinGameTrait;
use crate::hasher::hash_vec;
use once_cell::sync::Lazy;
use std::sync::Mutex;

pub const MAX_POSITION: u64 = 10;

pub static GAME_STATE: Lazy<Mutex<SpinGameStates>> = Lazy::new(||
    Mutex::new(SpinGameStates::new(0, 0))
);

impl SpinGameTrait for SpinGame {
    /* STATEFUL FUNCTIONS This defines the initialization of the game*/
    // TODO clean this up
    fn initialize_game(args: SpinGameStates) {
        let mut game_state = GAME_STATE.lock().unwrap();

        game_state.total_steps = args.total_steps;
        game_state.current_position = args.current_position;
    }

    /* STATEFUL FUNCTIONS This is defines the logic when player moves one step/entering one command*/
    fn step(input: u64) {
        let mut game_state = GAME_STATE.lock().unwrap();

        match input {
            0 => {
                if game_state.current_position != 0 {
                    game_state.current_position -= 1;

                    game_state.total_steps += 1;
                }
            }
            1 => {
                if game_state.current_position != MAX_POSITION {
                    game_state.current_position += 1;

                    game_state.total_steps += 1;
                }
            }
            _ => {
                panic!("Invalid command");
            }
        }
    }

    /* PURE FUNCTION This function returns the game state, to be used in Rust and Zkmain */
    fn get_game_state() -> SpinGameStates {
        let game = GAME_STATE.lock().unwrap().clone();
        return game;
    }

    /* PURE FUNCTION This function returns the game state, to be used in Rust and Zkmain */
    fn get_game_state_hash() -> [u64; 4] {
        let game = GAME_STATE.lock().unwrap().clone();
        return hash_vec(vec![game.total_steps, game.current_position]);
    }
}
