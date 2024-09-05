use crate::definition::SpinGameStates;

// DO NOT MODIFY THIS FILE
pub trait SpinGameTrait {
    fn initialize_game(args: SpinGameStates);
    fn step(input: u64);
    fn get_game_state() -> SpinGameStates;
    fn get_game_state_hash() -> [u64; 4];
}

pub struct SpinGame {}
