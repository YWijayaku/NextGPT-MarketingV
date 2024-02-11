'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { v4 as uuid } from 'uuid'
import { ChatGPInstance } from './Chat'
import { Chat, ChatMessage, Persona } from './interface'

export const DefaultPersonas: Persona[] = [
   {
    id: 'chatgpt',
    role: 'system',
    name: 'ChatGPT',
    prompt: 'You are an AI assistant that helps people find information.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing Blogger',
    prompt: 'Berperanlah sebagai seorang ahli blog marketing. Saya akan memberikan Anda topik tentang produk kecantikan organik, dan Anda akan memberikan panduan langkah demi langkah tentang bagaimana memanfaatkan blog untuk mengiklankan dan memasarkan produk ini secara efektif. Panduan Anda harus mencakup strategi kunci seperti pemilihan kata kunci, pengembangan konten, dan promosi melalui platform media sosial.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing SEM Google Ads',
    prompt: 'Berperanlah sebagai seorang ahli SEM dalam mengelola kampanye Google Ads. Saya akan memberikan Anda pertanyaan atau situasi spesifik mengenai kampanye iklan Google Ads, dan Anda akan memberikan panduan serta langkah-langkah yang efektif untuk menghadapi situasi tersebut guna mencapai hasil yang optimal. Panduan Anda harus mencakup strategi penargetan, pengaturan anggaran, pemilihan kata kunci, dan pengoptimalan iklan.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - SEM Instagram Ads',
    prompt: 'Saya ingin Anda berperan sebagai seorang ahli dalam mengelola kampanye iklan Instagram Ads. Silakan berikan panduan dan saran langkah demi langkah tentang bagaimana membuat dan mengoptimalkan kampanye iklan berbayar di Instagram untuk mencapai hasil yang maksimal. Saran Anda harus mencakup strategi pemilihan target audiens, penyusunan konten iklan yang efektif, pengaturan anggaran, pemantauan kinerja, dan taktik untuk meningkatkan interaksi dan konversi.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - Influencer Marketing',
    prompt: 'Berperanlah sebagai seorang influencer marketing (selebgram). Anda memiliki banyak pengikut setia di media sosial dan sering bekerja sama dengan merek-merek terkenal. Berikan saya panduan tentang cara menjalankan kampanye influencer marketing yang sukses. Termasuklah langkah-langkah untuk memilih produk yang sesuai, cara membuat konten yang menarik, strategi untuk meningkatkan keterlibatan pengikut, dan bagaimana mengukur efektivitas kampanye secara keseluruhan.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - Digital Marketing',
    prompt: 'Berperanlah sebagai seorang pakar pemasaran digital. Saya akan memberikan situasi atau pertanyaan yang berkaitan dengan merk personal branding di media sosial, dan Anda akan memberikan panduan serta langkah-langkah untuk membangun citra personal yang kuat secara online. Panduan Anda harus mencakup strategi untuk meningkatkan visibilitas, interaksi, dan kredibilitas.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - SEO',
    prompt: 'Bagaimana cara efektif untuk meningkatkan peringkat situs web di hasil pencarian Google menggunakan strategi SEO? Sertakan langkah-langkah penting yang perlu diambil, mulai dari optimisasi konten hingga taktik teknis, untuk membantu situs web mencapai peringkat yang lebih tinggi dan meningkatkan jumlah kunjungan organik.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - Web Traffic',
    prompt: 'Berperanlah sebagai Ahli Web Traffic & Analisa. Saya akan memberikan Anda pertanyaan dan skenario terkait peningkatan lalu lintas situs web dan analisis data. Anda diharapkan memberikan panduan dan saran langkah demi langkah untuk mengatasi situasi ini dan mencapai pertumbuhan lalu lintas yang signifikan.',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - Affiliate Marketing',
    prompt: 'Saya ingin Anda berperan sebagai ahli dalam bidang Affiliate Marketing. Saya akan memberikan Anda pertanyaan atau situasi yang berkaitan dengan strategi pemasaran afiliasi, dan Anda akan memberikan panduan serta langkah-langkah yang efektif untuk mengatasi situasi tersebut. ',
    isDefault: true
  },
   {
    id: 'chatgpt',
    role: 'system',
    name: 'RoleGPT Marketing - Book & eBook Marketing',
    prompt: 'Saya ingin Anda berperan sebagai ahli dalam pemasaran Buku & eBook. Saya akan memberikan Anda pertanyaan atau skenario spesifik mengenai memasarkan dan mempromosikan buku atau eBook, dan Anda akan memberikan panduan atau saran langkah demi langkah tentang bagaimana menangani situasi tersebut untuk mencapai keberhasilan pemasaran. Saran Anda harus mencakup taktik dan strategi yang efektif dalam konteks pemasaran buku dan eBook.',
    isDefault: true

]

enum StorageKeys {
  Chat_List = 'chatList',
  Chat_Current_ID = 'chatCurrentID'
}

const uploadFiles = async (files: File[]) => {
  let formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })
  const { data } = await axios<any>({
    method: 'POST',
    url: '/api/document/upload',
    data: formData,
    timeout: 1000 * 60 * 5
  })
  return data
}

let isInit = false

const useChatHook = () => {
  const searchParams = useSearchParams()

  const debug = searchParams.get('debug') === 'true'

  const [_, forceUpdate] = useReducer((x: number) => x + 1, 0)

  const messagesMap = useRef<Map<string, ChatMessage[]>>(new Map<string, ChatMessage[]>())

  const chatRef = useRef<ChatGPInstance>(null)

  const currentChatRef = useRef<Chat | undefined>(undefined)

  const [chatList, setChatList] = useState<Chat[]>([])

  const [personas, setPersonas] = useState<Persona[]>([])

  const [editPersona, setEditPersona] = useState<Persona | undefined>()

  const [isOpenPersonaModal, setIsOpenPersonaModal] = useState<boolean>(false)

  const [personaModalLoading, setPersonaModalLoading] = useState<boolean>(false)

  const [openPersonaPanel, setOpenPersonaPanel] = useState<boolean>(false)

  const [personaPanelType, setPersonaPanelType] = useState<string>('')

  const [toggleSidebar, setToggleSidebar] = useState<boolean>(false)

  const onOpenPersonaPanel = (type: string = 'chat') => {
    setPersonaPanelType(type)
    setOpenPersonaPanel(true)
  }

  const onClosePersonaPanel = useCallback(() => {
    setOpenPersonaPanel(false)
  }, [setOpenPersonaPanel])

  const onOpenPersonaModal = () => {
    setIsOpenPersonaModal(true)
  }

  const onClosePersonaModal = () => {
    setEditPersona(undefined)
    setIsOpenPersonaModal(false)
  }

  const onChangeChat = useCallback((chat: Chat) => {
    const oldMessages = chatRef.current?.getConversation() || []
    const newMessages = messagesMap.current.get(chat.id) || []
    chatRef.current?.setConversation(newMessages)
    chatRef.current?.focus()
    messagesMap.current.set(currentChatRef.current?.id!, oldMessages)
    currentChatRef.current = chat
    forceUpdate()
  }, [])

  const onCreateChat = useCallback(
    (persona: Persona) => {
      const id = uuid()
      const newChat: Chat = {
        id,
        persona: persona
      }

      setChatList((state) => {
        return [...state, newChat]
      })

      onChangeChat(newChat)
      onClosePersonaPanel()
    },
    [setChatList, onChangeChat, onClosePersonaPanel]
  )

  const onToggleSidebar = useCallback(() => {
    setToggleSidebar((state) => !state)
  }, [])

  const onDeleteChat = (chat: Chat) => {
    const index = chatList.findIndex((item) => item.id === chat.id)
    chatList.splice(index, 1)
    setChatList([...chatList])
    if (currentChatRef.current?.id === chat.id) {
      currentChatRef.current = chatList[0]
    }
    if (chatList.length === 0) {
      onOpenPersonaPanel('chat')
    }
  }

  const onCreatePersona = async (values: any) => {
    const { type, name, prompt, files } = values
    const persona: Persona = {
      id: uuid(),
      role: 'system',
      name,
      prompt,
      key: ''
    }

    if (type === 'document') {
      try {
        setPersonaModalLoading(true)
        const data = await uploadFiles(files)
        persona.key = data.key
      } catch (e) {
        console.log(e)
        toast.error('Error uploading files')
      } finally {
        setPersonaModalLoading(false)
      }
    }

    setPersonas((state) => {
      const index = state.findIndex((item) => item.id === editPersona?.id)
      if (index === -1) {
        state.push(persona)
      } else {
        state.splice(index, 1, persona)
      }
      return [...state]
    })

    onClosePersonaModal()
  }

  const onEditPersona = async (persona: Persona) => {
    setEditPersona(persona)
    onOpenPersonaModal()
  }

  const onDeletePersona = (persona: Persona) => {
    setPersonas((state) => {
      const index = state.findIndex((item) => item.id === persona.id)
      state.splice(index, 1)
      return [...state]
    })
  }

  const saveMessages = (messages: ChatMessage[]) => {
    if (messages.length > 0) {
      localStorage.setItem(`ms_${currentChatRef.current?.id}`, JSON.stringify(messages))
    } else {
      localStorage.removeItem(`ms_${currentChatRef.current?.id}`)
    }
  }

  useEffect(() => {
    const chatList = (JSON.parse(localStorage.getItem(StorageKeys.Chat_List) || '[]') ||
      []) as Chat[]
    const currentChatId = localStorage.getItem(StorageKeys.Chat_Current_ID)
    if (chatList.length > 0) {
      const currentChat = chatList.find((chat) => chat.id === currentChatId)
      setChatList(chatList)

      chatList.forEach((chat) => {
        const messages = JSON.parse(localStorage.getItem(`ms_${chat?.id}`) || '[]') as ChatMessage[]
        messagesMap.current.set(chat.id!, messages)
      })

      onChangeChat(currentChat || chatList[0])
    } else {
      onCreateChat(DefaultPersonas[0])
    }

    return () => {
      document.body.removeAttribute('style')
      localStorage.setItem(StorageKeys.Chat_List, JSON.stringify(chatList))
    }
  }, [])

  useEffect(() => {
    if (currentChatRef.current?.id) {
      localStorage.setItem(StorageKeys.Chat_Current_ID, currentChatRef.current.id)
    }
  }, [currentChatRef.current?.id])

  useEffect(() => {
    localStorage.setItem(StorageKeys.Chat_List, JSON.stringify(chatList))
  }, [chatList])

  useEffect(() => {
    const loadedPersonas = JSON.parse(localStorage.getItem('Personas') || '[]') as Persona[]
    const updatedPersonas = loadedPersonas.map((persona) => {
      if (!persona.id) {
        persona.id = uuid()
      }
      return persona
    })
    setPersonas(updatedPersonas)
  }, [])

  useEffect(() => {
    localStorage.setItem('Personas', JSON.stringify(personas))
  }, [personas])

  useEffect(() => {
    if (isInit && !openPersonaPanel && chatList.length === 0) {
      onCreateChat(DefaultPersonas[0])
    }
    isInit = true
  }, [chatList, openPersonaPanel, onCreateChat])

  return {
    debug,
    DefaultPersonas,
    chatRef,
    currentChatRef,
    chatList,
    personas,
    editPersona,
    isOpenPersonaModal,
    personaModalLoading,
    openPersonaPanel,
    personaPanelType,
    toggleSidebar,
    onOpenPersonaModal,
    onClosePersonaModal,
    onCreateChat,
    onDeleteChat,
    onChangeChat,
    onCreatePersona,
    onDeletePersona,
    onEditPersona,
    saveMessages,
    onOpenPersonaPanel,
    onClosePersonaPanel,
    onToggleSidebar,
    forceUpdate
  }
}

export default useChatHook
