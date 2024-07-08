use crate::definition::SpinGameInitArgs;
use crate::definition::SpinGameIntermediateStates;

// DO NOT MODIFY THIS FILE
pub trait SpinGameTrait {
    fn initialize_game(args: SpinGameInitArgs);
    fn step(input: u64);
    fn get_game_state() -> SpinGameIntermediateStates;
}

pub struct SpinGame {}
