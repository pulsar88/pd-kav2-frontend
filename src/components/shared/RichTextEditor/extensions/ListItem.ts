import ListItem from '@tiptap/extension-list-item'

/**
 * Allow any block (including images) inside a list item so media
 * does not split the list and break sink/lift nesting.
 */
const CustomListItem = ListItem.extend({
    content: 'block+',
})

export default CustomListItem
