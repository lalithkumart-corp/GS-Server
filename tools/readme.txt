WINDOWS: Working with batch script
    Visit: https://www.windowscentral.com/how-create-and-run-batch-file-windows-10

WINDOWS: To find and Kill a process running on a port.
    METHOD-1
        Syntax:
            1. netstat -a -o -n
            2. taskkill /F /PID typeyourfoundPIDhere
        Example:
            1.  C:\Users\Ganesh Ji>netstat -a -o -n

            Active Connections
            
            Proto  Local Address          Foreign Address        State           PID
            TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       3184
            TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       576
            TCP    0.0.0.0:443            0.0.0.0:0              LISTENING       3184
            TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4
            TCP    0.0.0.0:3003           0.0.0.0:0              LISTENING       16676
            TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING       3340
            TCP    0.0.0.0:3648           0.0.0.0:0              LISTENING       4
            
            2.  C:\Users\Ganesh Ji>taskkill /F /PID 16676
                SUCCESS: The process with PID 16676 has been terminated.
            


    METHOD-2
        Syntax:
            1. netstat -ano | findstr :yourPortNumber
            2. taskkill /PID typeyourPIDhere /F
        Example:
            1.  C:\Users\Ganesh Ji>netstat -ano | findstr :3003
                TCP    0.0.0.0:3003           0.0.0.0:0              LISTENING       8060
            2.  C:\Users\Ganesh Ji>taskkill /PID 8060 /F
                SUCCESS: The process with PID 8060 has been terminated.
