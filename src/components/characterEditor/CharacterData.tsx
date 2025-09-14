import CopyButton from '@/components/CopyButton'
import ImageDrop from '@/components/ImageDrop'
import ToolbarDial from '@/components/characterEditor/ToolbarDial'
import TextFieldWithTokenCounter from '@/components/ui/form/TextFieldWithTokenCounter'
import useAppDispatch from '@/hooks/useAppDispatch'
import useAppSelector from '@/hooks/useAppSelector'
import { updateCharacterEditor } from '@/state/characterEditorSlice'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AIGeneration from '../AIGeneration'
import { type FC } from 'react'

const CharacterData: FC = () => {
  const characterEditorState = useAppSelector((state) => state.characterEditor)
  const dispatch = useAppDispatch()

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateCharacterEditor({ [event.target.id]: event.target.value }))
  }
  const getFieldPrompt = (field: keyof typeof characterEditorState, basePrompt?: string) => {
    switch (field) {
      case 'name':
        return basePrompt || 'Generate a unique and fitting name for a character.'
      case 'description':
        return basePrompt || 'Write a detailed physical and personality description for this character.\n\nMake sure to include:\n- Physical appearance\n- Key personality traits\n- Background information\n- Notable skills or abilities'
      case 'personality':
        return basePrompt || 'Write a concise summary of this character\'s personality traits, behaviors, and tendencies.'
      case 'mes_example':
        return basePrompt || 'Write 2-3 example messages showing how this character typically speaks and behaves. Include their speech patterns, mannerisms, and typical reactions. Each example should start with <START>'
      case 'scenario':
        return basePrompt || 'Write a brief scenario or context setting for an interaction with this character.'
      case 'first_mes':
        return basePrompt || 'Write an engaging first message from this character that establishes their personality and starts a conversation naturally.'
      default:
        return basePrompt || ''
    }
  }

  const getCurrentFieldContext = (field: keyof typeof characterEditorState) => {
    let context = `Character Name: ${characterEditorState.name}\n\n`
    
    if (characterEditorState.description && field !== 'description') {
      context += `Description:\n${characterEditorState.description}\n\n`
    }
    
    if (characterEditorState.personality && field !== 'personality') {
      context += `Personality:\n${characterEditorState.personality}\n\n`
    }

    return context
  }

  return (
    <>
      <Typography
        variant="h2"
        align="center"
        gutterBottom
      >
        Character Data
      </Typography>
      <Typography
        variant="body1"
        gutterBottom
      >
        General data about your character. All fields sent at the prompt should
        accept the macros{' '}
        <CopyButton textToCopy="{{char}}">
          &#123;&#123;char&#125;&#125;
        </CopyButton>{' '}
        and{' '}
        <CopyButton textToCopy="{{user}}">
          &#123;&#123;user&#125;&#125;
        </CopyButton>{' '}
        which will be replaced by the character and user name respectively, this
        is very useful to quickly change the character name without having to
        edit all the content. Specific tools such as{' '}
        <Link
          href="https://docs.sillytavern.app/usage/core-concepts/characterdesign/#replacement-tags-macros"
          target="_blank"
          rel="noreferrer"
        >
          Silly Tavern have their own list of macros
        </Link>{' '}
        that can be used and it is advisable to take them into account if you
        use such tools.
      </Typography>
      <Stack spacing={1}>
        <TextField
          id="name"
          label="Name"
          value={characterEditorState.name}
          onChange={handleChange}
          error={characterEditorState.name === ''}
          helperText={
            characterEditorState.name === ''
              ? 'Name is required'
              : 'The name of your character, this is the only field where you should not use the {{char}} macro.'
          }
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ name: text }))}
          defaultPrompt={getFieldPrompt('name')}
          label="Generate Name"
          helperText="Generate a name for your character"
        />
      </Stack>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2, mb: 4 }}
        onClick={async () => {
          const basePrompt = prompt('Enter a brief description or keywords for your character (e.g., "A wise old wizard who loves tea and tells bad jokes"):')
          if (!basePrompt) return
          
          // Check if AI provider is configured
          const provider = window.localStorage.getItem('selectedAiProvider')
          if (!provider) {
            alert('Please configure an AI provider in settings first.')
            return
          }
          
          // Import the generateText function
          const { generateText } = await import('@/services/aiProvider')
          const aiProviders = JSON.parse(window.localStorage.getItem('aiProviders') ?? '[]')
          const selectedProvider = aiProviders.find((p: any) => p.name === provider)
          
          if (!selectedProvider) {
            alert('Selected AI provider not found.')
            return
          }

          // Generate character information sequentially to maintain consistency
          const generateField = async (field: keyof typeof characterEditorState, contextSoFar: string = '') => {
            try {
              // For the name field, we don't want any context
              // For other fields, we use the context built up so far
              const context = field === 'name' ? '' : contextSoFar;
              const fullPrompt = context ? `${context}

${getFieldPrompt(field, basePrompt)}` : getFieldPrompt(field, basePrompt);
              
              const response = await generateText(selectedProvider, fullPrompt);
              dispatch(updateCharacterEditor({ [field]: response.text }));
              
              // Build context for next field
              let newContext = contextSoFar;
              if (field === 'name') {
                newContext = `Character Name: ${response.text}

`;
              } else if (field === 'description') {
                newContext += `Description:
${response.text}

`;
              } else if (field === 'personality') {
                newContext += `Personality:
${response.text}

`;
              }
              
              return { success: true, context: newContext };
            } catch (error) {
              console.error('Failed to generate field:', field, error);
              alert(`Failed to generate ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              return { success: false, context: contextSoFar };
            }
          }

          const fields: Array<keyof typeof characterEditorState> = [
            'name',
            'description',
            'personality',
            'scenario',
            'first_mes',
            'mes_example'
          ];

          // Process fields sequentially with proper context
          let context = '';
          for (const field of fields) {
            const result = await generateField(field, context);
            if (!result.success) break;
            context = result.context;
          }
        }}
      >
        Generate Complete Character
      </Button>
      <Stack spacing={1}>
        <TextFieldWithTokenCounter
          id="description"
          label="Description"
          value={characterEditorState.description}
          onChange={handleChange}
          error={characterEditorState.description === ''}
          helperText={
            characterEditorState.description === ''
              ? 'Description is required'
              : 'Used to add the character description and the rest that the AI should know. This will always be present in the prompt, so all the important facts should be included here.'
          }
          variant="outlined"
          multiline
          minRows={3}
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ description: text }))}
          context={getCurrentFieldContext('description')}
          defaultPrompt={getFieldPrompt('description')}
          label="Generate Description"
          helperText="Generate a detailed character description"
        />

        <TextFieldWithTokenCounter
          id="personality"
          label="Personality"
          value={characterEditorState.personality}
          helperText="A brief description of the personality."
          onChange={handleChange}
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ personality: text }))}
          context={getCurrentFieldContext('personality')}
          defaultPrompt={getFieldPrompt('personality')}
          label="Generate Personality"
          helperText="Generate personality traits"
        />

        <TextFieldWithTokenCounter
          id="mes_example"
          label="Message Example"
          value={characterEditorState.mes_example}
          onChange={handleChange}
          helperText={
            <>
              Describes how the character speaks. Before each example, you need to
              add the <CopyButton textToCopy="<START>">&lt;START&gt;</CopyButton>{' '}
              macro.
            </>
          }
          multiline
          minRows={3}
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ mes_example: text }))}
          context={getCurrentFieldContext('mes_example')}
          defaultPrompt={getFieldPrompt('mes_example')}
          label="Generate Message Examples"
          helperText="Generate example messages showing speech patterns"
        />

        <TextFieldWithTokenCounter
          id="scenario"
          label="Scenario"
          value={characterEditorState.scenario}
          onChange={handleChange}
          helperText="Circumstances and context of the dialogue."
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ scenario: text }))}
          context={getCurrentFieldContext('scenario')}
          defaultPrompt={getFieldPrompt('scenario')}
          label="Generate Scenario"
          helperText="Generate a scenario or context"
        />

        <TextFieldWithTokenCounter
          id="first_mes"
          label="First Message"
          value={characterEditorState.first_mes}
          onChange={handleChange}
          helperText="The First Message is an important thing that sets exactly how and in what style the character will communicate."
          multiline
          minRows={3}
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <AIGeneration
          onGenerate={(text) => dispatch(updateCharacterEditor({ first_mes: text }))}
          context={getCurrentFieldContext('first_mes')}
          defaultPrompt={getFieldPrompt('first_mes')}
          label="Generate First Message"
          helperText="Generate an engaging first message"
        />
      </Stack>
      <Typography
        variant="h3"
        gutterBottom
      >
        Alternate Greetings
      </Typography>
      <Typography
        variant="caption"
        component="p"
        gutterBottom
      >
        You can add as many alternative greetings as you wish to your character.
        These greetings will be used as alternatives to the First Message.
      </Typography>
      {characterEditorState.alternate_greetings.length > 0 &&
        characterEditorState.alternate_greetings.map((greeting, index) => (
          <Stack key={`alternate_greeting_${index}`} spacing={1}>
            <TextFieldWithTokenCounter
              id={`alternate_greeting[${index}]`}
              label={`Alternate Greeting ${index + 1}`}
              value={greeting}
              onChange={(event) => {
                const newAlternateGreetings = [
                  ...characterEditorState.alternate_greetings
                ]
                newAlternateGreetings[index] = event.target.value
                dispatch(
                  updateCharacterEditor({
                    alternate_greetings: newAlternateGreetings
                  })
                )
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const newAlternateGreetings = [
                          ...characterEditorState.alternate_greetings
                        ]
                        newAlternateGreetings.splice(index, 1)
                        dispatch(
                          updateCharacterEditor({
                            alternate_greetings: newAlternateGreetings
                          })
                        )
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faTrashAlt}
                        size="sm"
                      />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              multiline
              minRows={2}
              variant="outlined"
              fullWidth
              margin="normal"
            />
            <AIGeneration
              onGenerate={(text) => {
                const newAlternateGreetings = [...characterEditorState.alternate_greetings]
                newAlternateGreetings[index] = text
                dispatch(updateCharacterEditor({ alternate_greetings: newAlternateGreetings }))
              }}
              context={getCurrentFieldContext('first_mes')}
              defaultPrompt="Write an alternative greeting message that shows a different side of the character's personality while maintaining their core traits."
              label={`Generate Alternate Greeting ${index + 1}`}
              helperText="Generate an alternative greeting"
            />
          </Stack>
        ))}
      <Button
        variant="contained"
        onClick={() => {
          dispatch(
            updateCharacterEditor({
              alternate_greetings: [
                ...characterEditorState.alternate_greetings,
                'Hello!'
              ]
            })
          )
        }}
        sx={{
          marginY: 2
        }}
      >
        Add Alternate Greeting
      </Button>
      <Typography
        variant="h3"
        gutterBottom
      >
        Image
      </Typography>
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: theme.spacing(2),
          marginY: theme.spacing(2),
          [theme.breakpoints.up('md')]: {
            gridTemplateColumns: '1fr 1fr'
          }
        })}
      >
        <div>
          <ImageDrop
            onDropedImage={(imageUrl) => {
              dispatch(updateCharacterEditor({ image: imageUrl }))
            }}
          />
        </div>
        <div
          css={{
            dispaly: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            aspectRatio: '2/1'
          }}
        >
          {characterEditorState.image !== undefined && (
            <img
              src={characterEditorState.image}
              alt={`${characterEditorState.name}-image`}
              css={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </Box>
      <ToolbarDial />
    </>
  )
}

export default CharacterData
