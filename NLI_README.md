# Setup

Following is a short setup guide on how to get started with the natural language interface for the BigUML editor.

## Requirements

Make sure that you have the following tools installed, before you proceed with the next steps.

+ [VS Code](https://code.visualstudio.com/)
+ [Java 17 JDK](https://www.oracle.com/java/technologies/javase/jdk14-archive-downloads.html)
+ [Docker](https://www.docker.com/get-started/)
+ [Sox](https://sourceforge.net/projects/sox/files/sox/14.4.1/) **version 14.4.1** for audio recording. Once downloaded, please make sure to add the folder where it is installed to the PATH variable.


## NLI Server

1. Pull NLI Server
```cmd 
docker pull sschwantler/nli4uml:latest
```

2. Start docker container
```cmd
docker run -p 8000:8000 sschwantler/nli4uml
```
On the first startup, this may take some time as the speech-to-text model must be downloaded.

## VS Code Extension

The `.vsix` can be found at [the latest release](https://github.com/sschwantler/bigUML/releases/latest).

Please refer to the official [tutorial](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) on how to install an extention from `.vsix`.

You can also install using the VS Code --install-extension command-line switch providing the path to the .vsix file.

```cmd
code --install-extension myextension.vsix
```

# Usage

Once the setup is done, open VS Code.
1. Select File -> Open Folder... -> select or create an empty folder which will be your working directory
1. Select File -> New File -> New Empty UML Diagram.
2. Provide a name and select CLASS as the diagram type.
3. The NLI component is located in the left side bar.

<img src="./media/nli/usage1.png" alt="drawing" style="width:800px;"/>

The NLI Integration provides two interaction methods:
1. Record Voice
2. Directly input the query

<img src="./media/nli/usage2.png" alt="drawing" style="width:800px;"/>

When "Start Recording" is clicked, your voice is recorded for a fixed time of 5 seconds. 
Once the recording is done, it is processed and directly executed. The text field will also be updated accordingly.

If you don't want to use voice recording, but input the query directly in the text field, you have to manually send the command by clicking "Send Command".

# Logs

All recorded audio snippets and the transcription history will be stored in the folder `logs` of your workspace directory.

<img src="./media/nli/animals_logs.png" alt="drawing" style="width:800px;"/>

# Usage Example
<img src="./media/nli/fast_animals_v2.gif" style="width:800px;" alt="Demo" />

# Troubleshooting
If you experience any issues, contact **"dominik.bork@tuwien.ac.at"**

# Limitations

Each command can only support one operation at a time. Therefore it is not possible to perform multiple operations at once. 
For example, the command "Create a class person with the public attribute name" is not supported and should be provided as two commands (create class, add atttribute).

Note that new elements will always be positioned in the top-left corner of your editor's view. If you place multiple elements subsequently, they will be placed on top of each other.

When moving elements, their new position must always be specified in relation to existing other elements.

Note that some commands require a selected element (e.g. change name, change visibility, change datatype, move).
There are no predefined datatypes, they must also be created before referenced.

# Useful Commands

Commands can be provided in natural language. Following are some suggestions.

+ Create a class named computer
+ Define a interface called university
+ Create a new abstract class named animal
+ Add a data type named string to the diagram 

- Focus on class computer
- Select the interface university

+ Add a public attribute named size of type string
+ Introduce a private attribute color with datatype string

- Define a public method get size returning string
- Add get color as a protected method with return type string

+ Update the name to school
+ Change the visibility to public
+ Modify the datatype to integer

- Remove the class called computer
- Delete interface named university


+ Add an generalization from cat to animal
+ Between classes school and university, create a composition called attends
+ Create an association called teaches linking teacher with student

- Move it to the bottom of class computer
- Place it right of the class school
- Position it south of the interface school
