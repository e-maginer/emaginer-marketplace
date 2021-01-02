# emaginer-marketplace
Emaginer marketplace: a digital store for online retail of men’s, women’s, and kid’s apparel, accessories, and shoes

## Git/GitHub Quick Start
1. [Download and install the latest version of Git](https://git-scm.com/downloads)
2. [Setting your username in Git](https://docs.github.com/en/free-pro-team@latest/github/using-git/setting-your-username-in-git)
 - [Setup your commit email address on GitHub](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-your-github-user-account/setting-your-commit-email-address#setting-your-commit-email-address-on-github)
 - keep your email address private when performing web-based Git operations by clicking "Keep my email address private"
 - [Setup your commit email address in Git to use GitHub-provided no-reply email address](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-your-github-user-account/setting-your-commit-email-address#setting-your-commit-email-address-in-git) 
 3. [Block command line pushes that expose your personal email address](https://docs.github.com/en/free-pro-team@latest/github/setting-up-and-managing-your-github-user-account/blocking-command-line-pushes-that-expose-your-personal-email-address)
 4. [Authenticate with GitHub from Git using HTTPS](https://docs.github.com/en/free-pro-team@latest/github/using-git/which-remote-url-should-i-use#cloning-with-https-urls): The next time you clone an HTTPS URL that requires authentication, Git will prompt you for your username and password. When Git prompts you for your password, enter your personal access token (PAT) instead. Password-based authentication for Git is deprecated, and using a PAT is more secure. For more information, see "[Creating a personal access token.](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)".
  - To be able to retrieve data from a repository hosted on GitHub, or share your projects, you need to register your GitHub account in IntelliJ IDEA (WebStorm). For more information, see [Register a GitHub account](https://www.jetbrains.com/help/idea/github.html#register-account) 
  5. [Ignoring files](https://docs.github.com/en/free-pro-team@latest/github/using-git/ignoring-files): use the .gitignore file in the repository's root directory to share the ignore rules with other users who clone the repository. Optionally, you can use ".git/info/exclude" file for locally-generated files that you don't expect other users to generate, such as files created by your editor. 
 
 Note: One of the cardinal rules of Git is that, since so much work is local within your clone, you have a great deal of freedom to rewrite your history locally. However, once you push your work, it is a different story entirely, and you should consider pushed work as final unless you have good reason to change it. In short, you should avoid pushing your work until you’re happy with it and ready to share it with the rest of the world.

### GitHub Workflow
1. [Create a Topic branch](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository) from the repository. 
 - You must have write access to a repository to create a branch, open a pull request, or delete and restore branches in a pull request. For more information, see "Access permissions on GitHub."
 - 
3. Create a local branch based on the snapshot of the remote tracking reference (i.e. tracking branch): 
 - git pull
 - git checkout -b trackingBranch origin/trackingBranch
4. Create, edit, rename, move, or delete files in the local tracking branch.
 -Whenever you add, edit, or delete a file, you're making a commit, and adding them to your branch. This process of adding commits keeps track of your progress as you work on a feature branch. Furthermore, each commit is considered a separate unit of change. This lets you roll back changes if a bug is found, or if you decide to head in a different direction.
5. Push changes to the remote: push to the remote at least once a day (and potentially several times) to comply with the Continuous Integration process considering:
 - pushing small patches starting from API layer then GUI
 - Using feature toggles: feature_toggle = on during development, and releasing from main branch feature_toggle = false if the feature is not done (anything in the main branch is always deployable.).
5. [Send a pull request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request) from your branch with your proposed changes to kick off a discussion.
 - Once you're satisfied with your work, you can open a pull request to merge the changes in the current branch (the head branch) into another branch (the base branch). For more information, see "About pull requests."
 - Anyone with read permissions to a repository can create a pull request, but you must have write permissions to create a branch. If you want to create a new branch for your pull request and don't have write permissions to the repository, you can fork the repository first.
6. Make changes on your branch as needed. Your pull request will update automatically.
7. Deploy to preprod: Once your pull request has been reviewed and the branch passes your tests, you can deploy your changes to verify them in production. If your branch causes issues, you can roll it back by deploying the existing main branch into production.
7. [Merge the pull request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/merging-a-pull-request) once the branch is ready to be merged.
 - Anyone with push access to the repository can complete the merge **(TO BE RESTRICTED FOR THE MAIN BRANCH)**
 - determine the best merge strategy (merge commit, squash and merge, or (rebase and merge) for the organization
8. [Tidy up your branches](https://docs.github.com/en/free-pro-team@latest/github/administering-a-repository/deleting-and-restoring-branches-in-a-pull-request) using the delete button in the pull request or on the branches page.




