// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title UserRegistry
 * @dev Contract to manage user registration and role assignment
 */
contract UserRegistry is AccessControl, Pausable {
    // User structure
    struct User {
        address userAddress;
        string name;
        string email;
        string phoneNumber;
        string location;
        bytes32 role;
        bool isActive;
        uint256 registeredAt;
        string profileHash; // IPFS hash for additional profile data
    }

    // State variables
    mapping(address => User) public users;
    mapping(bytes32 => address[]) public roleUsers;
    address[] public allUsers;

    // Role constants
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Events
    event UserRegistered(
        address indexed userAddress,
        string name,
        bytes32 role,
        uint256 timestamp
    );

    event UserRoleUpdated(
        address indexed userAddress,
        bytes32 oldRole,
        bytes32 newRole,
        address updatedBy
    );

    event UserDeactivated(address indexed userAddress, address deactivatedBy);
    event UserReactivated(address indexed userAddress, address reactivatedBy);

    // Modifiers
    modifier onlyRegisteredUser() {
        require(users[msg.sender].userAddress != address(0), "User not registered");
        require(users[msg.sender].isActive, "User account is deactivated");
        _;
    }

    modifier validRole(bytes32 _role) {
        require(
            _role == FARMER_ROLE ||
            _role == DISTRIBUTOR_ROLE ||
            _role == RETAILER_ROLE ||
            _role == REGULATOR_ROLE,
            "Invalid role"
        );
        _;
    }

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @dev Register a new user
     * @param _name User's name
     * @param _email User's email
     * @param _phoneNumber User's phone number
     * @param _location User's location
     * @param _role User's role
     * @param _profileHash IPFS hash for additional profile data
     */
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _phoneNumber,
        string memory _location,
        bytes32 _role,
        string memory _profileHash
    ) external validRole(_role) whenNotPaused {
        require(users[msg.sender].userAddress == address(0), "User already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");

        // Create new user
        User memory newUser = User({
            userAddress: msg.sender,
            name: _name,
            email: _email,
            phoneNumber: _phoneNumber,
            location: _location,
            role: _role,
            isActive: true,
            registeredAt: block.timestamp,
            profileHash: _profileHash
        });

        users[msg.sender] = newUser;
        roleUsers[_role].push(msg.sender);
        allUsers.push(msg.sender);

        // Grant role in AccessControl
        _grantRole(_role, msg.sender);

        emit UserRegistered(msg.sender, _name, _role, block.timestamp);
    }

    /**
     * @dev Update user role (admin only)
     * @param _userAddress User's address
     * @param _newRole New role to assign
     */
    function updateUserRole(
        address _userAddress,
        bytes32 _newRole
    ) external onlyRole(DEFAULT_ADMIN_ROLE) validRole(_newRole) whenNotPaused {
        require(users[_userAddress].userAddress != address(0), "User not found");
        
        bytes32 oldRole = users[_userAddress].role;
        require(oldRole != _newRole, "User already has this role");

        // Update user role
        users[_userAddress].role = _newRole;

        // Update role mappings
        _removeFromRoleArray(oldRole, _userAddress);
        roleUsers[_newRole].push(_userAddress);

        // Update AccessControl roles
        _revokeRole(oldRole, _userAddress);
        _grantRole(_newRole, _userAddress);

        emit UserRoleUpdated(_userAddress, oldRole, _newRole, msg.sender);
    }

    /**
     * @dev Deactivate user account (admin only)
     * @param _userAddress User's address
     */
    function deactivateUser(address _userAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(users[_userAddress].userAddress != address(0), "User not found");
        require(users[_userAddress].isActive, "User already deactivated");

        users[_userAddress].isActive = false;
        
        // Revoke role from AccessControl
        _revokeRole(users[_userAddress].role, _userAddress);

        emit UserDeactivated(_userAddress, msg.sender);
    }

    /**
     * @dev Reactivate user account (admin only)
     * @param _userAddress User's address
     */
    function reactivateUser(address _userAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(users[_userAddress].userAddress != address(0), "User not found");
        require(!users[_userAddress].isActive, "User already active");

        users[_userAddress].isActive = true;
        
        // Grant role back in AccessControl
        _grantRole(users[_userAddress].role, _userAddress);

        emit UserReactivated(_userAddress, msg.sender);
    }

    /**
     * @dev Update user profile
     * @param _name New name
     * @param _email New email
     * @param _phoneNumber New phone number
     * @param _location New location
     * @param _profileHash New profile hash
     */
    function updateProfile(
        string memory _name,
        string memory _email,
        string memory _phoneNumber,
        string memory _location,
        string memory _profileHash
    ) external onlyRegisteredUser whenNotPaused {
        User storage user = users[msg.sender];
        
        if (bytes(_name).length > 0) user.name = _name;
        if (bytes(_email).length > 0) user.email = _email;
        if (bytes(_phoneNumber).length > 0) user.phoneNumber = _phoneNumber;
        if (bytes(_location).length > 0) user.location = _location;
        if (bytes(_profileHash).length > 0) user.profileHash = _profileHash;
    }

    // View functions

    /**
     * @dev Get user details
     * @param _userAddress User's address
     * @return User struct
     */
    function getUser(address _userAddress) external view returns (User memory) {
        require(users[_userAddress].userAddress != address(0), "User not found");
        return users[_userAddress];
    }

    /**
     * @dev Get users by role
     * @param _role Role identifier
     * @return Array of user addresses
     */
    function getUsersByRole(bytes32 _role) external view returns (address[] memory) {
        return roleUsers[_role];
    }

    /**
     * @dev Get all registered users
     * @return Array of user addresses
     */
    function getAllUsers() external view returns (address[] memory) {
        return allUsers;
    }

    /**
     * @dev Check if user is registered and active
     * @param _userAddress User's address
     * @return Boolean indicating status
     */
    function isActiveUser(address _userAddress) external view returns (bool) {
        return users[_userAddress].userAddress != address(0) && users[_userAddress].isActive;
    }

    /**
     * @dev Get total number of users
     * @return Total user count
     */
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }

    // Internal helper functions

    /**
     * @dev Remove user from role array
     * @param _role Role to remove from
     * @param _userAddress User address to remove
     */
    function _removeFromRoleArray(bytes32 _role, address _userAddress) internal {
        address[] storage roleArray = roleUsers[_role];
        for (uint256 i = 0; i < roleArray.length; i++) {
            if (roleArray[i] == _userAddress) {
                roleArray[i] = roleArray[roleArray.length - 1];
                roleArray.pop();
                break;
            }
        }
    }

    // Admin functions

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}