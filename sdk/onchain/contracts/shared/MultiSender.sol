// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSender {
    function distributeETH(address[] memory recipients, uint256 amount) external payable {
        require(msg.value >= amount * recipients.length, "Insufficient ETH");
        require(msg.value <= amount * recipients.length, "Excess ETH");
        require(recipients.length > 0, "No recipients");
        require(amount > 0, "Amount must be greater than 0");

        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amount);
        }
    }

    function distributeETHWithDifferentAmounts(address[] memory recipients, uint256[] memory amounts)
        external
        payable
    {
        require(recipients.length == amounts.length, "Array lengths must be equal");

        require(recipients.length > 0, "No recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(amounts[i]);
        }

        require(address(this).balance == 0, "Excess ETH");
    }

    function checkBalance(address[] memory wallets) external view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](wallets.length);

        for (uint256 i = 0; i < wallets.length; i++) {
            balances[i] = wallets[i].balance;
        }

        return balances;
    }

    function burn() external {
        payable(address(0)).transfer(address(this).balance);
    }
}
