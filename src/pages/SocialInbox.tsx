import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Send,
    MoreVertical,
    User,
    Instagram,
    Facebook,
    CheckCircle2,
    Clock,
    Filter,
    Paperclip,
    Smile,
    Hash,
    ArrowLeft
} from "lucide-react";
import { useInbox, Conversation, Message } from "@/hooks/useInbox";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SocialInbox = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { conversations, isLoading, sendMessage, getMessages, updateStatus, cannedResponses } = useInbox(selectedPropertyId);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");

    const selectedConversation = conversations.find(c => c.id === selectedConvId);
    const { data: messages = [], isLoading: isLoadingMessages } = getMessages(selectedConvId || undefined);

    const handleSendMessage = () => {
        if (!selectedConvId || !messageText.trim()) return;
        sendMessage.mutate({ conversationId: selectedConvId, text: messageText });
        setMessageText("");
    };

    const currentProviderIcon = (provider: string) => {
        if (provider === 'instagram') return <Instagram className="h-4 w-4 text-pink-500" />;
        return <Facebook className="h-4 w-4 text-blue-600" />;
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col h-[calc(100vh-4rem)] lg:flex-row overflow-hidden">
                {/* Conversation List */}
                <div className={cn(
                    "w-full lg:w-80 border-r bg-card flex flex-col shrink-0 transition-all",
                    selectedConvId ? "hidden lg:flex" : "flex"
                )}>
                    <div className="p-4 border-b space-y-4">
                        <h1 className="text-xl font-bold">Inbox Unificada</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9 bg-muted/50 border-none" placeholder="Buscar conversas..." />
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="cursor-pointer">Todos</Badge>
                            <Badge variant="secondary" className="cursor-pointer opacity-50">Não lidos</Badge>
                            <Badge variant="secondary" className="cursor-pointer opacity-50">Atribuídos</Badge>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        {isLoading ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
                        ) : conversations.length > 0 ? (
                            <div className="divide-y">
                                {conversations.map((conv) => (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConvId(conv.id)}
                                        className={cn(
                                            "w-full p-4 flex gap-3 text-left hover:bg-muted/50 transition-colors",
                                            selectedConvId === conv.id && "bg-primary/5 border-l-2 border-primary"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={conv.guest_avatar || ""} />
                                            <AvatarFallback>{conv.guest_name?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm truncate">{conv.guest_name || "Convidado Anon"}</span>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(conv.last_message_at), 'HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate line-clamp-1">
                                                Previsão da última mensagem enviada aqui...
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                {currentProviderIcon(conv.provider)}
                                                <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase">
                                                    {conv.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Chat Timeline */}
                <div className={cn(
                    "flex-1 flex flex-col bg-muted/10 relative",
                    !selectedConvId ? "hidden lg:flex items-center justify-center p-8 text-center" : "flex"
                )}>
                    {!selectedConvId ? (
                        <div className="max-w-sm space-y-4">
                            <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                                <Hash className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold">Nenhuma conversa selecionada</h2>
                            <p className="text-sm text-muted-foreground">
                                Selecione um contato na lista ao lado para ver o histórico de mensagens e responder.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden"
                                        onClick={() => setSelectedConvId(null)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={selectedConversation?.guest_avatar || ""} />
                                        <AvatarFallback>{selectedConversation?.guest_name?.slice(0, 2).toUpperCase() || "GA"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-sm font-bold">{selectedConversation?.guest_name}</h3>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            {selectedConversation?.provider && currentProviderIcon(selectedConversation.provider)}
                                            via {selectedConversation?.provider}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selectedConvId, status: 'resolved' })}>
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Marcar como Resolvido
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selectedConvId, status: 'pending' })}>
                                                <Clock className="mr-2 h-4 w-4 text-orange-500" /> Mover para Pendente
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">Bloquear Usuário</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <ScrollArea className="flex-1 p-4">
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex",
                                                msg.direction === 'out' ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                                                msg.direction === 'out'
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-card text-card-foreground rounded-tl-none border"
                                            )}>
                                                <p className="leading-relaxed">{msg.text}</p>
                                                <span className={cn(
                                                    "text-[9px] mt-1 block opacity-70",
                                                    msg.direction === 'out' ? "text-right" : "text-left"
                                                )}>
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoadingMessages && <div className="text-center text-xs text-muted-foreground italic">Carregando histórico...</div>}
                                </div>
                            </ScrollArea>

                            {/* Message Input */}
                            <div className="p-4 bg-card border-t shrink-0">
                                <div className="max-w-4xl mx-auto space-y-4">
                                    <div className="flex gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="text-[10px] font-bold h-8">
                                                    <Hash className="mr-1.5 h-3 w-3" /> RESPOSTAS RÁPIDAS
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-80">
                                                <DropdownMenuLabel>Selecione um template</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {cannedResponses.length > 0 ? (
                                                    cannedResponses.map(resp => (
                                                        <DropdownMenuItem
                                                            key={resp.id}
                                                            onClick={() => setMessageText(resp.text)}
                                                            className="flex flex-col items-start gap-1 py-2"
                                                        >
                                                            <span className="font-bold text-xs">{resp.title}</span>
                                                            <span className="text-[10px] text-muted-foreground line-clamp-1">{resp.text}</span>
                                                        </DropdownMenuItem>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                                                        Nenhum template cadastrado.
                                                    </div>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Paperclip className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Smile className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            className="flex-1 bg-muted/30"
                                            placeholder="Escreva sua resposta..."
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <Button size="icon" onClick={handleSendMessage} disabled={sendMessage.isPending || !messageText.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SocialInbox;
