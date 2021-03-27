import { IHttp, IModify, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { ISlashCommand, SlashCommandContext } from "@rocket.chat/apps-engine/definition/slashcommands";

export class CEPCommand implements ISlashCommand {
    public command: string;
    public i18nParamsExample: string;
    public i18nDescription: string;
    public providesPreview: boolean;

    constructor(private readonly app: App) {
        this.command = 'cep';
        this.i18nParamsExample = 'cep-command-example';
        this.i18nDescription = 'cep-command-description';
        this.providesPreview = false;
    };

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        const message = await modify.getCreator().startMessage();

        const room = context.getRoom();
        const sender = await read.getUserReader().getById('rocket.cat');
        const args = context.getArguments();

        let messageText='';
        if(!args[0]){
            messageText = 'Please provide a valid Zip Code';
        } else {
            let response = await http.get(`https://viacep.com.br/ws/${args[0]}/json/`,{
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if(response.statusCode != 200){
                messageText = 'Invalid Zip Code or API Error';
            } else {

                let address = JSON.parse(response.content+'');

                let textAddress = 'CEP ' + args[0] + '\n';

                textAddress += address.logradouro ? address.logradouro+'\n':'';
                textAddress += address.bairro ? address.bairro+'\n':'';
                textAddress += address.localidade ? address.localidade + ' - ' + address.uf:'';
                messageText = textAddress;
            }
        }

        if (!room) {
            throw new Error('No room is configured for the message');
        }

        message
            .setSender(sender)
            .setRoom(room)
            .setText(messageText);

        modify.getCreator().finish(message);
        //modify.getNotifier().notifyRoom(room, message.getMessage());
    }
}

