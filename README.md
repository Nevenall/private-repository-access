# Private Repository Access

I have a couple of private repositories that I use for FoundryVTT packages. Previously I was using a personal access token in the url for authentication, however, Foundry recently switched to using fetch() to get package assets and that has far stricter security, namely not allowing url credentials. 

So, this project is a small service that will provide credentialed access to my private repos so I can install and update them in foundry without the need to manually copy files. 

