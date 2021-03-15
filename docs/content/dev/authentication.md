# User Profiles and Authentication
Each user in HedgeDoc 2 has a profile
which contains the following information:

- username (`janedoe`)
- display (`Jane Doe`)
- email address, optional (`janedoe@example.com`)
- profile picture, optional
- the date the user was created
- the date the profile was last updated 

HedgeDoc 2 supports multiple authentication methods per user.  
These are called *identities* and each identity is backed by an
auth provider (like OAuth, SAML, LDAP or internal auth).

One of a users identities may be marked as *sync source*.  
This identity is used to automatically update profile attributes like the
display name or profile picture. If a sync source exists, the
user can not manually edit their profile information.
If an external provider was used to create the account,
it is automatically used as sync source. 

The administrator may globally set an auth provider as sync source,
e.g. to enforce that all profile information comes from the corporate
LDAP and is the same across multiple applications.  
If a global sync source exists, new accounts can only be created using
that auth provider.

## Example
The administrator wants to allow users to log in via the corporate LDAP
and Google. Login must only be possible for users present in LDAP and 
all users must be displayed as they are in the LDAP.

The admin therefore sets up two login providers:

- corporate LDAP, marked as global sync source
- Google OAuth login

If a new user tries to log in via Google, they will not be found in the
database. The frontend detects that a global sync source exists and
suggests logging in via LDAP first.

After a new user created their account by logging in via LDAP, they can use
the 'add a new login method' feature in their profile page to link their
Google account and use it to login afterwards.
