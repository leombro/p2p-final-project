pragma solidity ^0.4.0;

import "./Catalog.sol";

/**
*  @title A contract that manages paid accesses to a resource.
*  @author Orlando Leombruni
*/
contract ContentManagementBase {

    // The address of the entity that manages the content, to be used for collecting payments
    address private owner;
    
    // "Human-readable" description that univocally identifies this content
    bytes32 public description;
    // The genre for this content
    bytes32 public genre;
    // "Human-readable" identity of the author
    bytes32 public author;
    // Price for the content
    uint public price;

    // Reference to the catalog in which the content is published
    Catalog private c;
    // A boolean indicating whether the content has already been published
    bool private setUp;

    // Event to signal that this content can be provided to the specified user
    event ProvideContent(bytes32 content, address user);
    // Event to signal that an user can leave feedback for this content
    event CanLeaveFeedback(bytes32 content, address user);
    
    /**
    *   Constructor for the content management contract.
    *
    *   @param descr unique description for the content. (Cannot be empty.)
    *   @param gen genre of the content. (Cannot be empty.)
    *   @param auth author of the content. (Cannot be empty.)
    */
    constructor(bytes32 descr, bytes32 gen, bytes32 auth, uint _price) public {
        require(descr != 0);
        require(gen != 0);
        require(auth != 0);
        description = descr;
        genre = gen;
        author = auth;
        price = _price;
        owner = msg.sender;
        setUp = false;
    }

    /**
    *   Basic function used in the frontend to check if catalog is still active.
    *
    *   Estimated gas cost: 214 (Remix estimation)
    */
    function isActiveContent() external pure returns (bool) {
        return true;
    }
    
    /** 
    *   Provides the content to an user, after checking that the user has indeed
    *   obtained authorization to consume it.
    *
    *   Estimated gas cost: ~1800 + the cost of calling Catalog.hasAccess(user).
    *
    *   @notice Make sure you've obtained access rights to this content.
    */
    function consumeContent() external {
        require(setUp, "This content is not available.");
        require(c.hasAccess(msg.sender), "User doesn't have rights to access this content");
        emit ProvideContent(description, msg.sender);
        emit CanLeaveFeedback(description, msg.sender);
    }
    
    /**
    *   Publishes the content to the specified Catalog.
    *
    *   Estimated gas cost: 41137 (Remix estimation) + the cost of calling Catalog.put_content(...).
    *
    *   @param a the address of the Catalog where the content will be published
    */
    function publish(address a) external {
        require (msg.sender == owner, "You are not the owner of this content");
        require (!setUp, "This content has already been published");
        c = Catalog(a);
        setUp = true;
        c.put_content(description, genre, author, price, owner);
    } 

    /**
    *   Closes this contract, removing the content from the provided Catalog and transferring all the funds
    *   to the contract's owner.
    *
    *   Estimated gas cost: 30149 (Remix estimation), plus the cost of calling Catalog.remove_content.
    */
    function closeContract() external {
        require(msg.sender == owner);
        c.remove_content();
        selfdestruct(owner);
    }

}