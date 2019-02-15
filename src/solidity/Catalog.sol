pragma solidity ^0.4.0;

/**
 *  @title A catalog to allow authors to publish and grant access to their contents.
 *  @author Orlando Leombruni
 */
contract Catalog {

    // The address of the entity that creates the catalog, to be used in the shutdown operation
    address private owner;

    // Price of premium subscription per block
    // Chosen to be about 0.05 USD at the time of writing
    uint private premiumPrice = 100 szabo;
    // Duration of p0remium subscription in blocks
    // Approx. 5 minutes using a blocktime of 15s (300/15), to ease testing
    uint private premiumTime = 20;
    // Threshold for payable views
    // Low number to ease testing
    uint private payableViews = 3;

    // Revenue from single consumptions
    uint private viewBalance = 0;
    // Revenue from premium subscriptions
    uint private premiumBalance = 0;

    // Event to signal (the owner of) a content that it can request a payment.
    event PaymentAvailable(address indexed contentPayable);
    // Event to signal an user that it has received a grant to access a content
    event GrantedAccess(address indexed user, address indexed requested, bytes32 description);
    // Event to signal an user that it has received a premium subscription or an extension to it
    event GotPremium(address indexed user);
    // Event to signal that a new content is available
    event NewContentAvailable(bytes32 descr, bytes32 genre, bytes32 author, uint price);


    // Modifier for payable functions, to set a minimum price
    modifier costs(uint minprice) {
        require (msg.value >= minprice, "No sufficient funds in this transaction");
        _;
    }

    // Possible states of the access to a content
    // Requested and RequestedPremium are two separate states in order to count only
    // non-premium accesses in the views count
    enum GrantState {
        NotRequested, 
        Requested,
        RequestedPremium
    }
    
    // Struct to represent a content and its associated metadata
    struct Content {
        address     addr;               // address of the content management contract
        address     owner;              // address of the owner of the content mgmt contract (EOA)
        bytes32     description;        // unique description
        bytes32     genre;              // genre metadata
        bytes32     author;             // author of the content
        uint        views;              // cumulative lifetime views
        uint        payCount;           // number of payments to be collected by the owner
        uint        price;              // price of the content (in wei), as set by author
        Feedback    feedback;           // feedback values
    }

    // Struct to hold feedback values for contents
    struct Feedback {
        uint appreciationSum;           // Sum of the "content appreciation" index
        uint fairnessSum;               // Sum of the "price fairness" index
        uint suggestSum;                // Sum of the "likeliness to suggest content" index
        uint number;                    // Number of feedbacks received
    }
    
    // Array of all contents published in the catalog, ordered from oldest to newest
    Content[] private contentList;

    // Mappings for quick retrieval of a content given its description or address
    //
    // Since Solidity mappings return 0 when a key has no associated value, a trick
    // has been devised: instead of storing the "real" index of the content, the
    // mappings store (index + 1). In this way, any zero value means that the requested
    // content is not published, and any other value is decremented by one before
    // being used as an index for the content list.
    mapping(bytes32 => uint) private descrToIndex;  
    mapping(address => uint) private addrToIndex;

    // Mapping of subscriptions, indexed by user addresses
    // For any user, the associated value is the last block number in which
    // the premium subscription is still active (i.e. the subscription expires at the following block)
    mapping(address => uint) private subscriptions;

    // Mapping of access grants, with two keys: user address and content (management) address
    mapping(address => mapping (address => GrantState)) private grants;
    // Mapping that indicates whether an user can leave feedback for a certain content
    mapping(address => mapping (address => bool)) private canLeaveFeedback;

    /**
    *   Constructor for the catalog. It fixes the owner of the catalog as the sender of the
    *   transaction message that created the contract.
    */
    constructor() public {
        owner = msg.sender;
    }

    /**
    *   Basic function used in the frontend to check if catalog is still active.
    */
    function isActiveCatalog() external pure returns (bool) {
        return true;
    }
    
    /**
    *   Allows the owner of a content to collect any available payment.
    *   Every available payment awards the owner of the content (payableViews * price), plus
    *   a fixed portion of the subscriptions revenue.
    *
    *   Estimated gas cost: ~48000 + cost for transfer of funds
    *    
    *   @param addr The address of the content (management) contract whose views produced
    *               the payment.
    */
    function collectPayment(address addr) external {
        uint index = addrToIndex[addr];
        require (index != 0, "No such content available");
        Content storage c = contentList[index - 1];
        require (c.owner == msg.sender, "You are not authorized to collect these payments.");
        uint numberPayments = c.payCount;
        require (numberPayments > 0, "No payment is available");
        uint avgRating = 5;
        if (c.feedback.number > 0) {
            avgRating = (c.feedback.appreciationSum + c.feedback.fairnessSum + c.feedback.suggestSum) / (3 * c.feedback.number);
        }
        uint amountViews = (numberPayments * payableViews * c.price * avgRating)/ 500;
        uint amountSubscr = numberPayments * premiumBalance / contentList.length;
        if (amountSubscr > premiumBalance) amountSubscr = premiumBalance;
        viewBalance -= amountViews;
        premiumBalance -= amountSubscr;
        c.payCount = 0;
        msg.sender.transfer(amountViews + amountSubscr);
    }

    /**
    *   Tells the owner of a content if there's any payment available.
    *   
    *   @param addr The address of the content contract to check
    */
    function checkPaymentAvailable(address addr) external view returns (bool) {
        uint index = addrToIndex[addr];
        require (index != 0, "No such content available");
        Content storage c = contentList[index - 1];
        require (c.owner == msg.sender, "You are not authorized to collect these payments.");
        return (c.payCount > 0);
    }

    /**
    *   Returns the number of views for each content.
    *
    *   Estimated gas cost: ~4000 if the list is empty, plus ~3500 for each additional
    *                       content published in the catalogue.
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @return five arrays: four for information (description/genre/author/price) about the contents published
    *           in the catalog, and another that contains the number of views for these contents. 
    *           The elements in these arrays refer to the same content if they share the same index,
    *           i.e. the content with description contList[i] has viewList[i] views.
    */
    function getStatistics() external view returns (bytes32[], bytes32[], bytes32[], uint[], uint[]) {
        uint sz = contentList.length;
        bytes32[] memory contList = new bytes32[](sz);
        bytes32[] memory genres = new bytes32[](sz);
        bytes32[] memory authors = new bytes32[](sz);
        uint[] memory prices = new uint[](sz);
        uint[] memory viewList = new uint[](sz);
        for(uint i = 0; i < sz; i++) {
            Content storage c = contentList[i];
            contList[i] = c.description;
            genres[i] = c.genre;
            authors[i] = c.author;
            prices[i] = c.price;
            viewList[i] = c.views;
        }
        return (contList, genres, authors, prices, viewList);
    }

    /**
    *   Returns the list of contents for which feedback can be left by the user.
    *
    *   @return An array of descriptions and an array of addresses 
    *           for the contents with the above property.
    */
    function feedbackAvailable() external view returns (bytes32[], address[]) {
        uint maxSz = contentList.length;
        uint sz = 0;
        for (uint i = 0; i < maxSz; i++) {
            if (canLeaveFeedback[msg.sender][contentList[i].addr]) {
                sz++;
            }
        }
        bytes32[] memory contents = new bytes32[](sz);
        address[] memory addresses = new address[](sz);
        uint count = 0;
        for (uint j = 0; j < maxSz; j++) {
            if (canLeaveFeedback[msg.sender][contentList[j].addr]) {
                contents[count] = contentList[j].description;
                addresses[count] = contentList[j].addr;
                count++;
            }
        }
        return (contents, addresses);
    }

    /**
    *   Returns the list of contents for which the user has obtained paid (non-premium) access grants.
    *
    *   @return An array of descriptions for the contents with the above property.
    */
    function grantsAvailable() external view returns (bytes32[]) {
        uint maxSz = contentList.length;
        uint sz = 0;
        for (uint i = 0; i < maxSz; i++) {
            if (grants[msg.sender][contentList[i].addr] == GrantState.Requested) {
                sz++;
            }
        }
        bytes32[] memory contents = new bytes32[](sz);
        uint count = 0;
        for (uint j = 0; j < maxSz; j++) {
            if (grants[msg.sender][contentList[j].addr] == GrantState.Requested) {
                contents[count] = contentList[j].description;
                count++;
            }
        }
        return contents;
    }

    /**
    *   Returns the list of contents without the number of views.
    *
    *   Estimated gas cost: ~800 if the list is empty, plus ~800 for each additional
    *                       content published in the catalogue.
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @return an array containing the descriptions of all published contents, in
    *           order of publication (oldest first).
    */
    function getContentList() external view returns (bytes32[]) {
        uint sz = contentList.length;
        bytes32[] memory contDescrs = new bytes32[](sz);
        for (uint i = 0; i < sz; i++) {
            Content storage c = contentList[i];
            contDescrs[i] = c.description;
        }
        return contDescrs;
    }

    /**
    *   Returns the list of contents that belong to the sender (as the creator).
    *
    *   @return two arrays, one that contains the description for the desired contents
    *           and the other one that contains their address.
    *           The elements in these arrays refer to the same content if they share the same index.
    */
    function getCreatorContentList() external view returns (bytes32[], address[]) {
        uint maxSz = contentList.length;
        uint sz = 0;
        for (uint i = 0; i < maxSz; i++) {
            if (contentList[i].owner == msg.sender) sz++;
        }
        bytes32[] memory descriptions = new bytes32[](sz);
        address[] memory addresses = new address[](sz);
        uint count = 0;
        for (uint j = 0; j < maxSz; j++) {
            Content storage c = contentList[j];
            if (c.owner == msg.sender) {
                descriptions[count] = c.description;
                addresses[count] = c.addr;
                count++;
            }
        }
        return (descriptions, addresses);
    }

    /**
    *   Returns the list of 'x' newest contents.
    *
    *   Estimated gas cost: ~850 if the list is empty, plus ~850 for each additional
    *                       content requested (up to the number of published contents).
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the number of requested newest contents.
    *   @return an array containing the descriptions of all requested contents, in
    *           reverse order of publication (newest first).
    */
    function getNewContentsList(uint x) external view returns (bytes32[]) {
        uint sz = contentList.length;
        bytes32[] memory contDescrs = new bytes32[](x);
        for (uint i = 0; i < x && i < sz; i++) {
            Content storage c = contentList[sz - i - 1];
            contDescrs[i] = c.description;
        }
        return contDescrs;
    }

    /**
    *   Returns the most recent content with genre 'x'.
    *
    *   Estimated gas cost: ~600 if the list is empty, plus ~830 for each scanned
    *                       content
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the requested genre
    *   @return the description of the latest content with genre x, if any.
    */
    function getLatestByGenre(bytes32 x) external view returns (bytes32 contentDesc) {
        uint sz = contentList.length;
        for (uint i = sz - 1; i >= 0; i--) { // Backwards scan to obtain latest contents first
            Content storage c = contentList[i]; 
            if (c.genre == x) {
                contentDesc = c.description;
                break;
            }
        }
    }

    /**
    *   Returns the content with genre 'x', which has received the maximum number of views.
    *
    *   Estimated gas cost: ~620 if the list is empty, plus ~830 for each scanned
    *                       content
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the requested genre
    *   @return the description of the most popular content with genre x, if any.
    */
    function getMostPopularByGenre(bytes32 x) external view returns (bytes32 contentDesc) {
        uint sz = contentList.length;
        uint maxViews = 0;
        for (uint i = 0; i < sz; i++) {
            Content storage c = contentList[i];
            if (c.genre == x) {
                if (c.views >= maxViews) {
                    contentDesc = c.description;
                    maxViews = c.views;
                }
            }
        }
    }

    /**
    *   Returns the most recent content of the author 'x'.
    *
    *   Estimated gas cost: ~600 if the list is empty, plus ~830 for each scanned
    *                       content
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the requested author
    *   @return the description of the latest content of the author x, if any.
    */
    function getLatestByAuthor(bytes32 x) external view returns (bytes32 contentDesc) {
        uint sz = contentList.length;
        for (uint i = sz - 1; i >= 0; i--) {
            Content storage c = contentList[i];
            if (c.author == x) {
                contentDesc = c.description;
                break;
            }
        }
    }

    /**
    *   Returns the content with most views of the author 'x'.
    *
    *   Estimated gas cost: ~620 if the list is empty, plus ~830 for each scanned
    *                       content
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the requested author
    *   @return the description of the most popular content of the author x, if any.
    *   @return the desired content's description
    */
    function getMostPopularByAuthor(bytes32 x) external view returns (bytes32 contentDesc) {
        uint sz = contentList.length;
        uint maxViews = 0;
        for (uint i = 0; i < sz; i++) {
            Content storage c = contentList[i];
            if (c.author == x) {
                if (c.views >= maxViews) {
                    contentDesc = c.description;
                    maxViews = c.views;
                }
            }
        }
    }
    
    /**
    *   Returns the content with highest average of all ratings.
    *
    *   @return the desired content's description
    */
    function getMostRated() external view returns (bytes32 result) {
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                uint currRate = 0;
                if (c.feedback.number > 0) {
                    currRate = c.feedback.appreciationSum + c.feedback.fairnessSum + c.feedback.suggestSum;
                    currRate /= (c.feedback.number * 3); 
                }
                if (currRate >= highestRate) {
                    highestRate = currRate;
                    result = c.description;
                }
            }
        }
        return result;
    }

    /**
    *   Returns the content with highest rating for feedback category y, 
    *   or highest average of all ratings if y is 0.
    *
    *   @notice Feedback categories are: 1 for the "content appreciation" category, 
    *           2 for the "price fairness" category, 
    *           3 for the "likeliness to suggest content to other users" category;
    *           0 for the content with highest average of all ratings.
    *   @param y the desired category, can be 0
    *   @return the desired content's description
    */
    function getMostRated(uint y) external view returns (bytes32 result) {
        require (y >= 0 && y <= 3, "Invalid category index");
        if (y == 0) return this.getMostRated();
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                uint currRate = 0;
                if (c.feedback.number > 0) {
                    currRate = ((y == 1) ? (c.feedback.appreciationSum) : 
                               ((y == 2) ? (c.feedback.fairnessSum) : (c.feedback.suggestSum)));
                    currRate /= c.feedback.number;
                }
                if (currRate >= highestRate) {
                    highestRate = currRate;
                    result = c.description;
                }
            }
        }
        return result;
    }

    /**
    *   Returns the content of genre 'x' with highest average of all ratings.
    *
    *   @param x the desired genre
    *   @return the desired content's description
    */

    function getMostRatedByGenre(bytes32 x) external view returns (bytes32 result) {
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                if (c.genre == x) {
                    uint currRate = 0;
                    if (c.feedback.number > 0) {
                        currRate = c.feedback.appreciationSum + c.feedback.fairnessSum + c.feedback.suggestSum;
                        currRate /= (c.feedback.number * 3);
                    }
                    if (currRate >= highestRate) {
                        highestRate = currRate;
                        result = c.description;
                    }
                }
            }
        }
        return result;
    }
    
    /**
    *   Returns the content with highest rating for feedback category y with genre x,
    *   or highest average of all ratings if y is 0.
    *
    *   @notice Feedback categories are: 1 for the "content appreciation" category, 
    *           2 for the "price fairness" category, 
    *           3 for the "likeliness to suggest content to other users" category;
    *           0 for the content with highest average of all ratings.
    *   @param x the desired genre
    *   @param y the desired category, can be 0
    *   @return the desired content's description
    */

    function getMostRatedByGenre(bytes32 x, uint y) external view returns (bytes32 result) {
        require (y >= 0 && y <= 3, "Invalid category index");
        if (y == 0) return this.getMostRatedByGenre(x);
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                if (c.genre == x) {
                    uint currRate = 0;
                    if (c.feedback.number > 0) {
                        currRate = ((y == 1) ? (c.feedback.appreciationSum) : 
                                ((y == 2) ? (c.feedback.fairnessSum) : (c.feedback.suggestSum)));
                        currRate /= c.feedback.number;
                    }
                    if (currRate >= highestRate) {
                        highestRate = currRate;
                        result = c.description;
                    }
                }
            }
        }
        return result;
    }
    
    /**
    *   Returns the content with author 'x' having the highest average of all ratings.
    *
    *   @param x the desired author
    *   @return the desired content's description
    */
    function getMostRatedByAuthor(bytes32 x) external view returns (bytes32 result) {
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                if (c.author == x) {
                    uint currRate = 0;
                    if (c.feedback.number > 0) {
                        currRate = c.feedback.appreciationSum + c.feedback.fairnessSum + c.feedback.suggestSum;
                        currRate /= (c.feedback.number * 3);
                    }
                    if (currRate >= highestRate) {
                        highestRate = currRate;
                        result = c.description;
                    }
                }
            }
        }
        return result;
    }

    /**
    *   Returns the content with highest rating for feedback category y with author x,
    *   or highest average of all ratings if y is 0.
    *
    *   @notice Feedback categories are: 1 for the "content appreciation" category, 
    *           2 for the "price fairness" category, 
    *           3 for the "likeliness to suggest content to other users" category;
    *           0 for the content with highest average of all ratings.
    *   @param x the desired author
    *   @param y the desired category, can be 0
    *   @return the desired content's description
    */
    function getMostRatedByAuthor(bytes32 x, uint y) external view returns (bytes32 result) {
        require (y >= 0 && y <= 3, "Invalid category index");
        if (y == 0) return this.getMostRatedByAuthor(x);
        uint sz = contentList.length;
        uint highestRate = 0;
        if (sz > 0) {
            for (uint i = 0; i < sz; i++) {
                Content storage c = contentList[i];
                if (c.author == x) {
                    uint currRate = 0;
                    if (c.feedback.number > 0) {
                        currRate = ((y == 1) ? (c.feedback.appreciationSum) : 
                                ((y == 2) ? (c.feedback.fairnessSum) : (c.feedback.suggestSum)));
                        currRate /= c.feedback.number;
                    }
                    if (currRate >= highestRate) {
                        highestRate = currRate;
                        result = c.description;
                    }
                }
            }
        }
        return result;
    }

    /**
    *   Returns true if 'x' holds a still valid premium account, false otherwise.
    *
    *   Estimated gas cost: 790 (Remix estimation)
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param x the address of the user to be checked.
    *   @return whether the user with address x has an active subscription.
    */
    function isPremium(address x) public view returns (bool) {
        uint endPremium = subscriptions[x];
        return (endPremium >= block.number);
    }

    /**
    *   Returns the price of a standard premium subscription.
    *
    *   Estimated gas cost: 610 (Remix estimation)
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @return the premium subscription's price.
    */
    function getPremiumPrice() public view returns (uint) {
        return premiumPrice * premiumTime;
    }
    
    /**
    *   Adds a content to the list, effectively publishing it to the catalog system.
    *   
    *   Estimated gas cost: 173142 (Remix estimation)
    *   Note: actual gas cost is usually less, depending on the size of the three bytes32 parameter
    *   
    *   @param desc the unique description for the content
    *   @param gen the content's genre
    *   @param auth the content's author
    *   @param own the address of the content's owner (to be used for payments)
    */
    function put_content(bytes32 desc, bytes32 gen, bytes32 auth, uint price, address own) external {
        require(desc != 0 && descrToIndex[desc] == 0);
        require(price >= 500); // Minimum price to avoid problems with floating-point conversions
        Content memory c;
        c.addr = msg.sender;
        c.description = desc;
        c.genre = gen;
        c.author = auth;
        c.owner = own;
        c.views = 0;
        c.price = price;
        c.payCount = 0;
        c.feedback = Feedback(0, 0, 0, 0);
        contentList.push(c);
        addrToIndex[msg.sender] = contentList.length;
        descrToIndex[desc] = contentList.length;
        emit NewContentAvailable(desc, gen, auth, price);
    }

    /**
    *   Removes a content from the list.
    *   
    *   Estimated gas cost: ~17000 (Remix estimation)
    */
    function remove_content() external {
        uint index = addrToIndex[msg.sender];
        require(index != 0, "No such content");
        bytes32 d = contentList[index - 1].description;
        delete contentList[index - 1];
        delete addrToIndex[msg.sender];
        delete descrToIndex[d];
    }
    
    /**
    *   Given the description of a content, returns its address.
    *
    *   Estimated gas cost: 1192 (Remix estimation)
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param cont the unique description for the content
    *   @return the content's address
    */
    function getContentAddress(bytes32 cont) external view returns (address) {
        uint index = descrToIndex[cont];
        require (index != 0, "No such content available");
        return contentList[index - 1].addr;
    }


    /**
    *   Pays for access to content 'cont'.
    *   
    *   Estimated gas cost: 45191 (Remix estimation) + the cost of transferring the change
    *
    *   @notice You need to pay at least `price` wei.
    *   @param cont the unique description for this content
    *   @return the address of the paid content.
    */
    function getContent(bytes32 cont) payable external returns (address) {
        return giftContent(cont, msg.sender);
    }

    /**
    *   Requests access to content 'cont' without paying, premium accounts only.
    *   
    *   Estimated gas cost: 22521 (Remix estimation).
    *
    *   @param cont the unique description for this content
    *   @return the address of the requested content.
    */
    function getContentPremium(bytes32 cont) external returns (address) {
        uint index = descrToIndex[cont];
        require (index != 0, "No such content available");
        require(isPremium(msg.sender), "You need to be a premium user.");
        Content storage c = contentList[index - 1];
        require (grants[msg.sender][c.addr] == GrantState.NotRequested, "You can already access this content");
        grants[msg.sender][c.addr] = GrantState.RequestedPremium;
        emit GrantedAccess(msg.sender, c.addr, c.description);
        return c.addr;
    }

    /**
    *   Pays for granting access to content 'cont' to the user 'user'.
    *   
    *   Estimated gas cost: 45119 (Remix estimation) + the cost of transferring the change
    *
    *   @param cont the unique description for this content
    *   @return the address of the paid content.
    */
    function giftContent(bytes32 cont, address user) payable public returns (address) {
        uint index = descrToIndex[cont];
        require (index != 0, "No such content available");
        require (!isPremium(user), "The user is a premium user, no need to pay for the content!");
        Content storage c = contentList[index - 1];
        require (msg.value >= c.price, "No sufficient funds in this transaction");
        require (grants[user][c.addr] == GrantState.NotRequested, "The user can already access this content");
        grants[user][c.addr] = GrantState.Requested;
        uint rest = msg.value - c.price;
        viewBalance += c.price;
        emit GrantedAccess(user, c.addr, c.description);
        if (rest > 0) {
            msg.sender.transfer(rest);
        }
        return c.addr;
    }

    /**
    *   Starts a new premium subscription, or extends the duration of the current one.
    *
    *   Estimated gas cost: 42875 (Remix estimation) + the cost of transferring the change
    *   Note: the cost is lower if a premium subscription was bought before, even if it's currently
    *         expired. (This is because a mapping already exists on the storage.)
    *
    *   @notice You need to pay at least `premiumPrice * premiumTime` wei.
    */
    function buyPremium() payable external costs(premiumPrice * premiumTime) {
        giftPremium(msg.sender);
    }

    /**
    *   Pays for granting a Premium Account to the user 'user' (or extend its duration).
    *
    *   Estimated gas cost: 42643 (Remix estimation) + the cost of transferring the change
    *   Note: the cost is lower if a premium subscription was bought before for user 'user', 
    *         even if such subscription is currently expired. 
    *         (This is because a mapping already exists on the storage.)
    *
    *   @notice You need to pay at least `premiumPrice * premiumTime` wei.
    *   @param user the user that will receive the premium subscription/extension.
    */
    function giftPremium(address user) payable public costs(premiumPrice * premiumTime) {
        uint startTime = subscriptions[user];
        if (startTime == 0 || startTime < block.number) startTime = block.number;
        subscriptions[user] = startTime + premiumTime;
        uint rest = msg.value - (premiumPrice * premiumTime);
        premiumBalance += premiumPrice * premiumTime;
        if (rest > 0) {
            msg.sender.transfer(rest);
        }
        emit GotPremium(user);
    }

    /**
    *   Checks that an user has access to the content; if so, it revokes the
    *   grant and returns true, else it returns false.
    *   This function must be called from the content's management contract;
    *   it uses 'msg.sender' to guarantee that no other entity can revoke a
    *   valid grant.
    *
    *   Estimated gas cost: 64353 (Remix estimation)
    *
    *   @notice Calling this function from outside a contract does nothing.
    *   @param user the user to be checked
    *   @return true if the user has access to the calling content, false otherwise   
    */
    function hasAccess(address user) external returns (bool granted) {
        GrantState g = grants[user][msg.sender];
        if (g == GrantState.Requested) {
            Content storage c = contentList[addrToIndex[msg.sender] - 1];
            c.views++;
            if (c.views % payableViews == 0) {
                c.payCount++;
                emit PaymentAvailable(c.addr);
            } 
            grants[user][msg.sender] = GrantState.NotRequested;
            canLeaveFeedback[user][msg.sender] = true;
            granted = true;
        } else if (g == GrantState.RequestedPremium) {
            grants[user][msg.sender] = GrantState.NotRequested;
            canLeaveFeedback[user][msg.sender] = true;
            granted = true;
        } else {
            granted = false;
        }
        return granted;
    }

    /**
    *   Allows an user to leave feedback for a content it has consumed.
    *
    *   Estimated gas cost: 64353 (Remix estimation)
    *
    *   @notice The user must have consumed the content.
    *   @param content address of the content to provide feedback for
    *   @param appreciation value for the appreciation index
    *   @param fairness value for the fairness index
    *   @param suggest value for the likeliness to suggest index
    */
    function leaveFeedback(address content, uint appreciation, uint fairness, uint suggest) external {
        require(canLeaveFeedback[msg.sender][content], "The user is not authorized to leave feedback");
        require(appreciation >= 0 && appreciation <= 5, "Invalid value for the appreciation index");
        require(fairness >= 0 && fairness <= 5, "Invalid value for the fairness index");
        require(suggest >= 0 && suggest <= 5, "Invalid value for the suggest index");
        uint normalizedAppr = appreciation * 100;
        uint normalizedFair = fairness * 100;
        uint normalizedSugg = suggest * 100;
        canLeaveFeedback[msg.sender][content] = false;
        Content storage c = contentList[addrToIndex[content] - 1];
        c.feedback.number++;
        c.feedback.appreciationSum += normalizedAppr;
        c.feedback.fairnessSum += normalizedFair;
        c.feedback.suggestSum += normalizedSugg;
    }

    /**
    *   Checks if the user can leave feedback for a content.
    *
    *   Estimated gas cost: 1080 (Remix estimation)
    *   Note: the gas cost is only paid if this function is called inside a non-view
    *         function in another contract.
    *
    *   @param addr The address of the content.
    */
    function checkLeaveFeedback(address addr) external view returns (bool) {
        return canLeaveFeedback[msg.sender][addr];
    }

    /**
    *   Closes the catalog, redistributing its balance to all published contents
    *   proportionally to the views of each content. Only the catalog owner can
    *   invoke this operation.
    *
    *   Note that if no content has a single view, any balance is equally redistributed
    *   as a fallback case.
    *
    *   Estimated gas cost: ~32000, plus ~1400 per content, plus the cost 
    *                       of transferring balance to each content.
    */
    function closeCatalog() external {
        require (msg.sender == owner);
        uint totalBalance = viewBalance + premiumBalance;
        uint viewsTotal = 0; 
        uint toPay;
        for (uint i = 0; i < contentList.length; i++) {
            viewsTotal += contentList[i].views;
        }
        for (uint j = 0; j < contentList.length; j++) {
            toPay = 0;
            if (j == contentList.length - 1) {
                toPay = totalBalance;
            } else {
                if (viewsTotal > 0) {
                    toPay = totalBalance * (contentList[j].views / viewsTotal);
                } else {
                    toPay = totalBalance/contentList.length;
                }
                totalBalance -= toPay;
            }
            contentList[j].owner.transfer(toPay);
        }
        selfdestruct(0);
    }
}