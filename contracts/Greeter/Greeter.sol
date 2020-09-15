pragma solidity >=0.5.0 <0.6.0;

contract mortal {
    /* Define variable owner of the type address*/
    address owner;

    /* this function is executed at initialization 
       and sets the owner of the contract */
    constructor() public { owner = msg.sender; }

    /* Function to recover the funds on the contract */
    function kill() public { if (msg.sender == owner) selfdestruct(msg.sender); }
}

contract greeter is mortal {
    /* define variable greeting of the type string */
    string greeting = "test123";
    event Approval(string _g);

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }

    /* main function */
    function greet() public view returns (string memory) {
        return greeting;
    }

    function fire() public {
        emit Approval(greeting);
    }
}
