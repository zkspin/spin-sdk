// DO NOT MODIFY THIS FILE
pub trait SpinGameTrait {
    fn initialize_game(args: Vec<u64>);
    fn step(input: u64);
    fn get_game_state() -> Vec<u64>;
}

pub struct SpinGame {}
